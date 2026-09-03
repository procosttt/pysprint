import {
  RUN_TIMEOUT_MS,
} from './protocol.ts'
import type {
  PythonWorkerPort,
  RunnerStatus,
  RunResultView,
  WorkerRequest,
  WorkerResponse,
} from './protocol.ts'

export type PythonRunnerOptions = {
  createWorker: () => PythonWorkerPort
  runTimeoutMs?: number
  generateId?: () => string
}

export type RunnerState = {
  status: RunnerStatus
  loadingPython: boolean
  message: string | null
  result: RunResultView | null
  activeRequestId: string | null
  canRun: boolean
  canStop: boolean
}

const LOAD_ERROR_MESSAGE =
  'Не удалось загрузить Python. Проверьте подключение к интернету'
const TIMEOUT_MESSAGE = 'Программа выполняется слишком долго'
const STOPPED_MESSAGE = 'Выполнение остановлено'
const LOADING_MESSAGE = 'Python загружается…'

let autoId = 0

function defaultId(): string {
  autoId += 1
  return `py-${Date.now().toString(36)}-${autoId}`
}

export class PythonRunner {
  private readonly createWorker: () => PythonWorkerPort
  private readonly runTimeoutMs: number
  private readonly generateId: () => string
  private readonly listeners = new Set<() => void>()
  private worker: PythonWorkerPort | null = null
  private generation = 0
  private loadStatus: 'loading' | 'ready' | 'load-error' = 'loading'
  private runStatus: 'idle' | 'running' | 'success' | 'python-error' | 'timeout' | 'stopped' =
    'idle'
  private activeRequestId: string | null = null
  private result: RunResultView | null = null
  private runTimer: ReturnType<typeof setTimeout> | null = null
  private messageListener: ((event: { data: WorkerResponse }) => void) | null = null
  private errorListener: ((event: Event) => void) | null = null
  private disposed = false
  private snapshot: RunnerState

  constructor(options: PythonRunnerOptions) {
    this.createWorker = options.createWorker
    this.runTimeoutMs = options.runTimeoutMs ?? RUN_TIMEOUT_MS
    this.generateId = options.generateId ?? defaultId
    this.snapshot = this.buildState()
    this.spawnWorker()
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  getState = (): RunnerState => this.snapshot

  private buildState(): RunnerState {
    const status = this.deriveStatus()
    const loadingPython = this.loadStatus === 'loading'
    return {
      status,
      loadingPython,
      message: this.deriveMessage(status),
      result: this.result,
      activeRequestId: this.activeRequestId,
      canRun: this.loadStatus === 'ready' && this.runStatus !== 'running',
      canStop: this.runStatus === 'running',
    }
  }

  run(code: string, stdin: string): boolean {
    if (this.loadStatus !== 'ready' || this.runStatus === 'running' || !this.worker) {
      return false
    }
    const requestId = this.generateId()
    this.activeRequestId = requestId
    this.runStatus = 'running'
    this.clearTimer()
    this.runTimer = setTimeout(() => {
      this.handleTimeout()
    }, this.runTimeoutMs)
    this.post({ type: 'run', requestId, code, stdin })
    this.emit()
    return true
  }

  stop(): void {
    if (this.runStatus !== 'running') {
      return
    }
    this.replaceWorker('stopped')
  }

  retryLoad(): void {
    if (this.runStatus === 'running') {
      return
    }
    this.replaceWorker(this.runStatus === 'timeout' ? 'timeout' : this.runStatus === 'stopped' ? 'stopped' : 'idle')
  }

  clearOutput(): void {
    if (this.runStatus === 'running') {
      return
    }
    this.result = null
    if (
      this.runStatus === 'success' ||
      this.runStatus === 'python-error' ||
      this.runStatus === 'timeout' ||
      this.runStatus === 'stopped'
    ) {
      this.runStatus = 'idle'
    }
    this.emit()
  }

  dispose(): void {
    this.disposed = true
    this.clearTimer()
    this.detachWorker()
    this.listeners.clear()
  }

  private deriveStatus(): RunnerStatus {
    if (this.loadStatus === 'load-error') {
      return 'load-error'
    }
    if (this.runStatus === 'running') {
      return 'running'
    }
    if (this.runStatus === 'timeout') {
      return 'timeout'
    }
    if (this.runStatus === 'stopped') {
      return 'stopped'
    }
    if (this.loadStatus === 'loading') {
      return 'loading'
    }
    if (this.runStatus === 'success') {
      return 'success'
    }
    if (this.runStatus === 'python-error') {
      return 'python-error'
    }
    return 'ready'
  }

  private deriveMessage(status: RunnerStatus): string | null {
    if (status === 'load-error') {
      return LOAD_ERROR_MESSAGE
    }
    if (status === 'timeout') {
      return TIMEOUT_MESSAGE
    }
    if (status === 'stopped') {
      return STOPPED_MESSAGE
    }
    if (status === 'loading') {
      return LOADING_MESSAGE
    }
    return this.result?.error?.message ?? null
  }

  private spawnWorker(): void {
    if (this.disposed) {
      return
    }
    this.detachWorker()
    this.loadStatus = 'loading'
    const generation = this.generation + 1
    this.generation = generation
    const worker = this.createWorker()
    this.worker = worker
    this.messageListener = (event) => {
      if (generation !== this.generation) {
        return
      }
      this.handleResponse(event.data)
    }
    this.errorListener = () => {
      if (generation !== this.generation) {
        return
      }
      this.handleLoadError()
    }
    worker.addEventListener('message', this.messageListener)
    worker.addEventListener('error', this.errorListener)
    this.post({ type: 'init', requestId: this.generateId() })
    this.emit()
  }

  private replaceWorker(nextRun: typeof this.runStatus): void {
    this.clearTimer()
    this.activeRequestId = null
    this.runStatus = nextRun
    if (nextRun === 'timeout' || nextRun === 'stopped') {
      this.result = {
        requestId: this.generateId(),
        stdout: '',
        stderr: '',
        ok: false,
        error: {
          name: nextRun === 'timeout' ? 'TimeoutError' : 'StoppedError',
          message: nextRun === 'timeout' ? TIMEOUT_MESSAGE : STOPPED_MESSAGE,
          traceback: '',
          line: null,
        },
        line: null,
        durationMs: nextRun === 'timeout' ? this.runTimeoutMs : 0,
      }
    }
    this.spawnWorker()
  }

  private handleTimeout(): void {
    if (this.runStatus !== 'running') {
      return
    }
    this.replaceWorker('timeout')
  }

  private handleLoadError(): void {
    this.clearTimer()
    this.activeRequestId = null
    this.loadStatus = 'load-error'
    this.runStatus = 'idle'
    this.emit()
  }

  private handleResponse(data: WorkerResponse): void {
    switch (data.type) {
      case 'loading':
        this.loadStatus = 'loading'
        this.emit()
        return
      case 'ready':
        this.loadStatus = 'ready'
        this.emit()
        return
      case 'error':
        if (data.kind === 'load-error') {
          this.handleLoadError()
        }
        return
      case 'result':
        this.handleResult(data)
        return
    }
  }

  private handleResult(data: Extract<WorkerResponse, { type: 'result' }>): void {
    if (data.requestId !== this.activeRequestId || this.runStatus !== 'running') {
      return
    }
    this.clearTimer()
    this.activeRequestId = null
    this.result = {
      requestId: data.requestId,
      stdout: data.stdout,
      stderr: data.stderr,
      ok: data.ok,
      error: data.error,
      line: data.line,
      durationMs: data.durationMs,
    }
    this.runStatus = data.ok ? 'success' : 'python-error'
    this.emit()
  }

  private post(message: WorkerRequest): void {
    this.worker?.postMessage(message)
  }

  private clearTimer(): void {
    if (this.runTimer !== null) {
      clearTimeout(this.runTimer)
      this.runTimer = null
    }
  }

  private detachWorker(): void {
    if (!this.worker) {
      return
    }
    if (this.messageListener) {
      this.worker.removeEventListener('message', this.messageListener)
    }
    if (this.errorListener) {
      this.worker.removeEventListener('error', this.errorListener)
    }
    this.worker.terminate()
    this.worker = null
    this.messageListener = null
    this.errorListener = null
  }

  private emit(): void {
    this.snapshot = this.buildState()
    for (const listener of this.listeners) {
      listener()
    }
  }
}
