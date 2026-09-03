type RunControlsProps = {
  canRun: boolean
  canStop: boolean
  loadError: boolean
  onRun: () => void
  onStop: () => void
  onRetryLoad: () => void
}

export function RunControls({
  canRun,
  canStop,
  loadError,
  onRun,
  onStop,
  onRetryLoad,
}: RunControlsProps) {
  return (
    <div className="run-check">
      <div className={`run-check-row${canStop ? ' run-check-row-running' : ''}`}>
        {loadError ? (
          <button
            type="button"
            className="run-check-button run-check-button-retry"
            onClick={onRetryLoad}
          >
            Повторить загрузку
          </button>
        ) : (
          <button
            type="button"
            className="run-check-button run-check-button-run"
            disabled={!canRun}
            onClick={onRun}
          >
            Запустить
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
        <button
          type="button"
          className="run-check-button"
          disabled
          title="Будет подключено на следующем этапе"
        >
          Проверить
        </button>
      </div>
    </div>
  )
}
