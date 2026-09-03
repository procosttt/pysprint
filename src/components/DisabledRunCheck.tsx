export function DisabledRunCheck() {
  return (
    <div className="run-check">
      <div className="run-check-row">
        <button
          type="button"
          className="run-check-button"
          disabled
          title="Будет подключено на следующем этапе"
        >
          Запустить
        </button>
        <button
          type="button"
          className="run-check-button"
          disabled
          title="Будет подключено на следующем этапе"
        >
          Проверить
        </button>
      </div>
      <p className="run-check-hint">Следующий этап</p>
    </div>
  )
}
