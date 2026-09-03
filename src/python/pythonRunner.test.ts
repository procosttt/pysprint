import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PythonRunner } from './PythonRunner.ts'
import { RUN_TIMEOUT_MS } from './protocol.ts'
import type { PythonWorkerPort, WorkerRequest, WorkerResponse } from './protocol.ts'

type FakeWorker = {
  port: PythonWorkerPort
  posted: WorkerRequest[]
  terminated: boolean
  emit: (data: WorkerResponse) => void
}

function createFakeWorker(): FakeWorker {
  const posted: WorkerRequest[] = []
  const messageListeners = new Set<(event: { data: WorkerResponse }) => void>()
  const fake: FakeWorker = {
    posted,
    terminated: false,
    port: {
      postMessage(message) {
        posted.push(message)
      },
      addEventListener(type, listener) {
        if (type === 'message') {
          messageListeners.add(listener as (event: { data: WorkerResponse }) => void)
        }
      },
      removeEventListener(type, listener) {
        if (type === 'message') {
          messageListeners.delete(listener as (event: { data: WorkerResponse }) => void)
        }
      },
      terminate() {
        fake.terminated = true
      },
    } as PythonWorkerPort,
    emit(data) {
      for (const listener of messageListeners) {
        listener({ data })
      }
    },
  }
  return fake
}

function latestRun(fake: FakeWorker): Extract<WorkerRequest, { type: 'run' }> {
  const message = [...fake.posted].reverse().find((item) => item.type === 'run')
  if (!message || message.type !== 'run') {
    throw new Error('run message not sent')
  }
  return message
}

describe('PythonRunner', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('transitions from loading to ready', () => {
    const workers: FakeWorker[] = []
    const runner = new PythonRunner({
      createWorker: () => {
        const worker = createFakeWorker()
        workers.push(worker)
        return worker.port
      },
    })

    expect(runner.getState().status).toBe('loading')
    const init = workers[0]?.posted.find((message) => message.type === 'init')
    expect(init?.type).toBe('init')

    workers[0]?.emit({ type: 'loading', requestId: init?.requestId ?? '' })
    workers[0]?.emit({ type: 'ready', requestId: init?.requestId ?? '' })

    expect(runner.getState().status).toBe('ready')
    runner.dispose()
  })

  it('sends code and stdin with a unique requestId', () => {
    const workers: FakeWorker[] = []
    const runner = new PythonRunner({
      createWorker: () => {
        const worker = createFakeWorker()
        workers.push(worker)
        return worker.port
      },
    })
    const init = workers[0]?.posted[0]
    workers[0]?.emit({ type: 'ready', requestId: init && init.type === 'init' ? init.requestId : 'x' })

    const started = runner.run('print(2 + 2)', '12\n8\n10')
    expect(started).toBe(true)

    const run = latestRun(workers[0]!)
    expect(run.code).toBe('print(2 + 2)')
    expect(run.stdin).toBe('12\n8\n10')
    expect(run.requestId).not.toBe(init && init.type === 'init' ? init.requestId : run.requestId)
    runner.dispose()
  })

  it('returns stdout and stderr from a result', () => {
    const workers: FakeWorker[] = []
    const runner = new PythonRunner({
      createWorker: () => {
        const worker = createFakeWorker()
        workers.push(worker)
        return worker.port
      },
    })
    const init = workers[0]!.posted[0]!
    workers[0]!.emit({ type: 'ready', requestId: init.requestId })
    runner.run('print(1)', '')
    const run = latestRun(workers[0]!)

    workers[0]!.emit({
      type: 'result',
      requestId: run.requestId,
      stdout: '1\n',
      stderr: 'warn\n',
      ok: true,
      error: null,
      line: null,
      durationMs: 12,
    })

    const state = runner.getState()
    expect(state.status).toBe('success')
    expect(state.result?.stdout).toBe('1\n')
    expect(state.result?.stderr).toBe('warn\n')
    runner.dispose()
  })

  it('rejects a second run while one is in progress', () => {
    const workers: FakeWorker[] = []
    const runner = new PythonRunner({
      createWorker: () => {
        const worker = createFakeWorker()
        workers.push(worker)
        return worker.port
      },
    })
    workers[0]!.emit({ type: 'ready', requestId: workers[0]!.posted[0]!.requestId })
    expect(runner.run('print(1)', '')).toBe(true)
    const postedAfterFirst = workers[0]!.posted.length
    expect(runner.run('print(2)', '')).toBe(false)
    expect(workers[0]!.posted.length).toBe(postedAfterFirst)
    runner.dispose()
  })

  it('ignores a result with a foreign or stale requestId', () => {
    const workers: FakeWorker[] = []
    const runner = new PythonRunner({
      createWorker: () => {
        const worker = createFakeWorker()
        workers.push(worker)
        return worker.port
      },
    })
    workers[0]!.emit({ type: 'ready', requestId: workers[0]!.posted[0]!.requestId })
    runner.run('print(1)', '')
    const run = latestRun(workers[0]!)

    workers[0]!.emit({
      type: 'result',
      requestId: 'stale-id',
      stdout: 'nope',
      stderr: '',
      ok: true,
      error: null,
      line: null,
      durationMs: 1,
    })

    expect(runner.getState().status).toBe('running')
    expect(runner.getState().result).toBeNull()

    workers[0]!.emit({
      type: 'result',
      requestId: run.requestId,
      stdout: '1\n',
      stderr: '',
      ok: true,
      error: null,
      line: null,
      durationMs: 4,
    })
    expect(runner.getState().status).toBe('success')
    expect(runner.getState().result?.stdout).toBe('1\n')
    runner.dispose()
  })

  it('times out by terminating the worker and creating a new one', () => {
    const workers: FakeWorker[] = []
    const runner = new PythonRunner({
      createWorker: () => {
        const worker = createFakeWorker()
        workers.push(worker)
        return worker.port
      },
    })
    workers[0]!.emit({ type: 'ready', requestId: workers[0]!.posted[0]!.requestId })
    runner.run('while True: pass', '')

    vi.advanceTimersByTime(RUN_TIMEOUT_MS)

    expect(workers[0]!.terminated).toBe(true)
    expect(workers.length).toBe(2)
    expect(runner.getState().status).toBe('timeout')
    expect(runner.getState().message).toBe('Программа выполняется слишком долго')
    expect(runner.getState().loadingPython).toBe(true)
    expect(workers[1]!.posted[0]?.type).toBe('init')
    runner.dispose()
  })

  it('stops the worker manually and restores a new worker', () => {
    const workers: FakeWorker[] = []
    const runner = new PythonRunner({
      createWorker: () => {
        const worker = createFakeWorker()
        workers.push(worker)
        return worker.port
      },
    })
    workers[0]!.emit({ type: 'ready', requestId: workers[0]!.posted[0]!.requestId })
    runner.run('while True: pass', '')
    runner.stop()

    expect(workers[0]!.terminated).toBe(true)
    expect(workers.length).toBe(2)
    expect(runner.getState().status).toBe('stopped')
    expect(runner.getState().message).toBe('Выполнение остановлено')
    expect(runner.getState().loadingPython).toBe(true)
    runner.dispose()
  })

  it('handles a load error and retries with a new worker', () => {
    const workers: FakeWorker[] = []
    const runner = new PythonRunner({
      createWorker: () => {
        const worker = createFakeWorker()
        workers.push(worker)
        return worker.port
      },
    })
    workers[0]!.emit({
      type: 'error',
      requestId: workers[0]!.posted[0]!.requestId,
      kind: 'load-error',
    })
    expect(runner.getState().status).toBe('load-error')
    expect(runner.getState().message).toContain('Не удалось загрузить Python')

    runner.retryLoad()
    expect(workers[0]!.terminated).toBe(true)
    expect(workers.length).toBe(2)
    expect(runner.getState().status).toBe('loading')
    workers[1]!.emit({ type: 'ready', requestId: workers[1]!.posted[0]!.requestId })
    expect(runner.getState().status).toBe('ready')
    runner.dispose()
  })

  it('can run successfully after a previous Python error', () => {
    const workers: FakeWorker[] = []
    const runner = new PythonRunner({
      createWorker: () => {
        const worker = createFakeWorker()
        workers.push(worker)
        return worker.port
      },
    })
    workers[0]!.emit({ type: 'ready', requestId: workers[0]!.posted[0]!.requestId })
    runner.run('print(', '')
    const first = latestRun(workers[0]!)
    workers[0]!.emit({
      type: 'result',
      requestId: first.requestId,
      stdout: '',
      stderr: 'SyntaxError',
      ok: false,
      error: {
        name: 'SyntaxError',
        message: 'SyntaxError',
        traceback: 'SyntaxError',
        line: 1,
      },
      line: 1,
      durationMs: 3,
    })
    expect(runner.getState().status).toBe('python-error')

    expect(runner.run('print(1)', '')).toBe(true)
    const second = latestRun(workers[0]!)
    expect(second.requestId).not.toBe(first.requestId)
    workers[0]!.emit({
      type: 'result',
      requestId: second.requestId,
      stdout: '1\n',
      stderr: '',
      ok: true,
      error: null,
      line: null,
      durationMs: 2,
    })
    expect(runner.getState().status).toBe('success')
    expect(runner.getState().result?.stdout).toBe('1\n')
    runner.dispose()
  })

  it('clears the timeout after a normal result', () => {
    const workers: FakeWorker[] = []
    const runner = new PythonRunner({
      createWorker: () => {
        const worker = createFakeWorker()
        workers.push(worker)
        return worker.port
      },
    })
    workers[0]!.emit({ type: 'ready', requestId: workers[0]!.posted[0]!.requestId })
    runner.run('print(1)', '')
    const run = latestRun(workers[0]!)
    workers[0]!.emit({
      type: 'result',
      requestId: run.requestId,
      stdout: '1\n',
      stderr: '',
      ok: true,
      error: null,
      line: null,
      durationMs: 5,
    })

    vi.advanceTimersByTime(RUN_TIMEOUT_MS + 1000)

    expect(workers[0]!.terminated).toBe(false)
    expect(workers.length).toBe(1)
    expect(runner.getState().status).toBe('success')
    runner.dispose()
  })
})
