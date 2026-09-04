import type { RunnerState } from '../python/PythonRunner.ts'

type ConsolePanelProps = {
  outputOpen: boolean
  onToggleOutput: () => void
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

export function ConsolePanel({ outputOpen, onToggleOutput, state, onGoToLine }: ConsolePanelProps) {
  const result = state.result
  const showOutput = result !== null || state.status === 'running'
  const stdout = result?.stdout ?? ''
  const emptyOutput = Boolean(result && result.ok && stdout.length === 0)
  const line = result?.line ?? result?.error?.line ?? null
  const statusMessage =
    state.message &&
    state.status !== 'success' &&
    state.status !== 'ready' &&
    state.status !== 'loading' &&
    !state.result?.error
      ? state.message
      : null

  if (!showOutput) {
    return (
      <section className="python-status" aria-label="Статус Python" aria-live="polite">
        <p className="console-status">{statusLabel(state)}</p>
        {state.status === 'load-error' && state.message ? (
          <p className="console-message">{state.message}</p>
        ) : (
          <p className="python-status-hint">Только текстовый вывод · лимит запуска 3 с</p>
        )}
      </section>
    )
  }

  return (
    <section className="console-panel" aria-label="Вывод">
      <button
        type="button"
        className="console-toggle"
        aria-expanded={outputOpen}
        onClick={onToggleOutput}
      >
        <span className="console-title">ВЫВОД</span>
        <span className="console-status">{statusLabel(state)}</span>
        <span className="prompt-toggle-action">{outputOpen ? 'Свернуть' : 'Открыть'}</span>
      </button>
      <p className="python-status-hint console-limit-hint">
        Только текстовый вывод · лимит запуска 3 с
      </p>

      {outputOpen ? (
        <div className="console-output" aria-live="polite">
          {state.loadingPython && state.status !== 'loading' ? (
            <p className="console-note">Python загружается…</p>
          ) : null}

          {statusMessage ? <p className="console-message">{statusMessage}</p> : null}

          {emptyOutput ? (
            <p className="console-note">Программа завершилась без вывода</p>
          ) : null}
          {stdout ? <pre className="console-pre console-stdout">{stdout}</pre> : null}
          {result?.error ? <p className="console-error">{result.error.message}</p> : null}

          {result ? (
            <div className="console-meta">
              <span>{Math.round(result.durationMs)} мс</span>
              {line !== null ? <span>Строка {line}</span> : null}
              {line !== null ? (
                <button type="button" className="go-to-line" onClick={() => onGoToLine(line)}>
                  К строке {line}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
