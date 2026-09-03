import type { PythonWorkerPort } from './protocol.ts'

export function createPythonWorker(): PythonWorkerPort {
  return new Worker(new URL('./python.worker.ts', import.meta.url), {
    type: 'module',
  }) as unknown as PythonWorkerPort
}
