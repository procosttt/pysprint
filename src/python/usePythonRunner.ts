import { useEffect, useState, useSyncExternalStore } from 'react'
import { createPythonWorker } from './createPythonWorker.ts'
import { PythonRunner } from './PythonRunner.ts'
import type { RunnerState } from './PythonRunner.ts'

const INITIAL_STATE: RunnerState = {
  status: 'loading',
  loadingPython: true,
  message: 'Python загружается…',
  result: null,
  activeRequestId: null,
  canRun: false,
  canStop: false,
}

export function usePythonRunner() {
  const [runner] = useState(
    () =>
      new PythonRunner({
        createWorker: createPythonWorker,
        autostart: false,
      }),
  )

  useEffect(() => {
    runner.attach()
    return () => {
      runner.dispose()
    }
  }, [runner])

  const state = useSyncExternalStore(runner.subscribe, runner.getState, () => INITIAL_STATE)

  return { runner, state }
}
