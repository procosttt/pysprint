# PySprint

Мобильный тренажёр коротких задач по Python. Этап 2: свободный запуск кода через Pyodide в отдельном Web Worker, без проверки решений.

## Что умеет сейчас

- Список из трёх задач, экран условия и редактор на `textarea`
- Панель быстрых Python-клавиш и черновики в `localStorage`
- Кнопка **Запустить** выполняет ровно код из редактора, как Run Module в IDLE
- Вывод `print()` и ошибки Python показываются в панели **ВЫВОД** после запуска
- Python загружается из npm-пакета `pyodide@314.0.6`, runtime — с CDN `https://cdn.jsdelivr.net/pyodide/v314.0.6/full/`
- Тайм-аут 3 секунды и кнопка **Остановить** завершают Worker и создают новый

## Требования

- Node.js 20 или новее
- npm

## Установка

```text
npm install
```

## Запуск (разработка)

```text
npm run dev
```

Откройте локальный URL из вывода Vite, обычно `http://localhost:5173`. Первая загрузка Python требует сеть; дальше помогает обычный HTTP-кэш браузера. Полный офлайн-режим будет на этапе 4.

## Тесты

```text
npm run test -- --run
```

Режим наблюдения:

```text
npm run test
```

## Проверка типов

```text
npm run typecheck
```

## Lint

```text
npm run lint
```

## Production-сборка

```text
npm run build
```

Просмотр собранного приложения:

```text
npm run preview
```
