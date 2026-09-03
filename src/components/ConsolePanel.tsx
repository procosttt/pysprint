import type { RunnerState } from '../python/PythonRunner.ts'

type ConsolePanelProps = {
  stdin: string
  onStdinChange: (value: string) => void
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

export function ConsolePanel({ stdin, onStdinChange, state, onGoToLine }: ConsolePanelProps) {
  const result = state.result
  const stdout = result?.stdout ?? ''
  const traceback = result?.error?.traceback ?? ''
  const stderr = result?.stderr ?? ''
  const extraStderr =
    stderr && traceback && stderr.trim() === traceback.trim() ? '' : stderr
  const emptyOutput = Boolean(result && result.ok && stdout.length === 0 && stderr.length === 0)
  const line = result?.line ?? result?.error?.line ?? null
  const showTraceback = Boolean(result && !result.ok && traceback)
  const statusMessage =
    state.message &&
    state.status !== 'success' &&
    state.status !== 'ready' &&
    state.status !== 'loading' &&
    !state.result?.error
      ? state.message
      : null

  return (
    <section className="console-panel" aria-label="Консоль">
      <div className="console-head">
        <p className="console-title">КОНСОЛЬ</p>
        <p className="console-status">{statusLabel(state)}</p>
      </div>

      <label className="console-block">
        <span className="console-caption">ВВОД</span>
        <textarea
          className="console-stdin"
          value={stdin}
          placeholder="Данные для input(), каждая строка отдельно"
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          autoComplete="off"
          aria-label="Данные для input(), каждая строка отдельно"
          onChange={(event) => onStdinChange(event.target.value)}
        />
      </label>

      <div className="console-block">
        <p className="console-caption">ВЫВОД</p>
        <div className="console-output" aria-live="polite">
          {state.loadingPython && state.status !== 'loading' ? (
            <p className="console-note">Python загружается…</p>
          ) : null}

          {statusMessage ? <p className="console-message">{statusMessage}</p> : null}

          {emptyOutput ? (
            <p className="console-note">Программа завершилась без вывода</p>
          ) : null}
          {stdout ? <pre className="console-pre console-stdout">{stdout}</pre> : null}
          {extraStderr ? <pre className="console-pre console-stderr">{extraStderr}</pre> : null}
          {result?.error ? <p className="console-error">{result.error.message}</p> : null}
          {showTraceback ? <pre className="console-pre console-traceback">{result?.error?.traceback}</pre> : null}

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
      </div>
    </section>
  )
}
