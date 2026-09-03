import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
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
  const [runner, setRunner] = useState<PythonRunner | null>(null)

  useEffect(() => {
    const instance = new PythonRunner({
      createWorker: createPythonWorker,
    })
    setRunner(instance)
    return () => {
      instance.dispose()
    }
  }, [])

  const subscribe = useCallback(
    (listener: () => void) => {
      if (!runner) {
        return () => {}
      }
      return runner.subscribe(listener)
    },
    [runner],
  )

  const state = useSyncExternalStore(
    subscribe,
    () => runner?.getState() ?? INITIAL_STATE,
    () => INITIAL_STATE,
  )

  return { runner, state }
}
