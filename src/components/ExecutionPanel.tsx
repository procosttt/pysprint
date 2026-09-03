import type { RunnerState } from '../python/PythonRunner.ts'

type ExecutionPanelProps = {
  state: RunnerState
  onGoToLine: (line: number) => void
}

function statusLabel(state: RunnerState): string {
  switch (state.status) {
    case 'loading':
      return 'Python загружается…'
    case 'ready':
      return 'Python готов'
    case 'running':
      return 'Выполняется…'
    case 'success':
      return 'Готово'
    case 'python-error':
      return 'Ошибка Python'
    case 'timeout':
      return 'Тайм-аут'
    case 'stopped':
      return 'Остановлено'
    case 'load-error':
      return 'Ошибка загрузки'
  }
}

export function ExecutionPanel({ state, onGoToLine }: ExecutionPanelProps) {
  const result = state.result
  const stdout = result?.stdout ?? ''
  const traceback = result?.error?.traceback ?? ''
  const stderr = result?.stderr ?? ''
  const extraStderr =
    stderr && traceback && stderr.trim() === traceback.trim() ? '' : stderr
  const emptyOutput = Boolean(result && result.ok && stdout.length === 0 && stderr.length === 0)
  const line = result?.line ?? result?.error?.line ?? null
  const showTraceback = Boolean(result && !result.ok && traceback)

  return (
    <section className="execution-panel" aria-live="polite" aria-label="Результат выполнения">
      <div className="execution-panel-head">
        <p className="execution-panel-title">Запуск на примере 1</p>
        <p className="execution-panel-status">{statusLabel(state)}</p>
      </div>

      {state.loadingPython && state.status !== 'loading' ? (
        <p className="execution-panel-note">Python загружается…</p>
      ) : null}

      {state.message &&
      state.status !== 'success' &&
      state.status !== 'ready' &&
      state.status !== 'loading' &&
      !state.result?.error ? (
        <p className="execution-panel-message">{state.message}</p>
      ) : null}

      {result ? (
        <div className="execution-panel-body">
          {emptyOutput ? (
            <p className="execution-panel-note">Программа завершилась без вывода</p>
          ) : null}
          {stdout ? (
            <pre className="execution-output execution-stdout">{stdout}</pre>
          ) : null}
          {extraStderr ? (
            <pre className="execution-output execution-stderr">{extraStderr}</pre>
          ) : null}
          {result.error ? (
            <p className="execution-error-short">{result.error.message}</p>
          ) : null}
          {showTraceback ? (
            <pre className="execution-traceback">{result.error?.traceback}</pre>
          ) : null}
          <div className="execution-panel-meta">
            <span>{Math.round(result.durationMs)} мс</span>
            {line !== null ? <span>Строка {line}</span> : null}
            {line !== null ? (
              <button
                type="button"
                className="go-to-line"
                onClick={() => onGoToLine(line)}
              >
                К строке {line}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  )
}
