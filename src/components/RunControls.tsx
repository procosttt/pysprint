type RunControlsProps = {
  canRun: boolean
  canStop: boolean
  loadingPython: boolean
  loadError: boolean
  onRun: () => void
  onStop: () => void
  onRetryLoad: () => void
}

export function RunControls({
  canRun,
  canStop,
  loadingPython,
  loadError,
  onRun,
  onStop,
  onRetryLoad,
}: RunControlsProps) {
  const showLoading = loadingPython && !canStop && !loadError
  const runLabel = loadError
    ? 'Повторить загрузку'
    : showLoading
      ? 'Загрузка Python…'
      : '▶ Запустить код'
  const runClass = loadError
    ? 'run-check-button run-check-button-retry'
    : showLoading
      ? 'run-check-button run-check-button-loading'
      : 'run-check-button run-check-button-run'

  return (
    <div className="run-check">
      <div className={`run-check-row${canStop ? ' run-check-row-running' : ''}`}>
        {loadError ? (
          <button type="button" className={runClass} onClick={onRetryLoad}>
            {runLabel}
          </button>
        ) : (
          <button type="button" className={runClass} disabled={!canRun} onClick={onRun}>
            {runLabel}
          </button>
        )}
        {canStop ? (
          <button
            type="button"
            className="run-check-button run-check-button-stop"
            onClick={onStop}
          >
            Остановить
          </button>
        ) : null}
      </div>
    </div>
  )
}
