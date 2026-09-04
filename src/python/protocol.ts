export const PYODIDE_INDEX_URL = 'https://cdn.jsdelivr.net/pyodide/v314.0.6/full/'
export const USER_CODE_FILENAME = '<user_code>'
export const RUN_TIMEOUT_MS = 3000
export { CODE_MAX_LENGTH, OUTPUT_LIMIT, OUTPUT_LIMIT_MESSAGE } from './outputLimit.ts'

export type WorkerRequest =
  | {
      type: 'init'
      requestId: string
    }
  | {
      type: 'run'
      requestId: string
      code: string
      stdin: string
    }

export type NormalizedError = {
  name: string
  message: string
  traceback: string
  line: number | null
}

export type WorkerResponse =
  | {
      type: 'loading'
      requestId: string
    }
  | {
      type: 'ready'
      requestId: string
    }
  | {
      type: 'result'
      requestId: string
      stdout: string
      stderr: string
      ok: boolean
      error: NormalizedError | null
      line: number | null
      durationMs: number
    }
  | {
      type: 'error'
      requestId: string
      kind: 'load-error'
    }

export type RunnerStatus =
  | 'loading'
  | 'ready'
  | 'running'
  | 'success'
  | 'python-error'
  | 'timeout'
  | 'stopped'
  | 'load-error'

export type RunResultView = {
  requestId: string
  stdout: string
  stderr: string
  ok: boolean
  error: NormalizedError | null
  line: number | null
  durationMs: number
}

export type WorkerMessageEvent = {
  data: WorkerResponse
}

export type PythonWorkerPort = {
  postMessage(message: WorkerRequest): void
  addEventListener(type: 'message', listener: (event: WorkerMessageEvent) => void): void
  addEventListener(type: 'error', listener: (event: Event) => void): void
  removeEventListener(type: 'message', listener: (event: WorkerMessageEvent) => void): void
  removeEventListener(type: 'error', listener: (event: Event) => void): void
  terminate(): void
}
