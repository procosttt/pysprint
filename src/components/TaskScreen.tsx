import { useEffect, useRef, useState } from 'react'
import { applyHistory } from '../editor/apply.ts'
import { canRedo, canUndo, commitChange, createHistory } from '../editor/history.ts'
import type { HistoryOp } from '../editor/types.ts'
import {
  getBrowserStorage,
  loadStore,
  markTaskOpened,
  persistStore,
  saveDraftCode,
} from '../storage/drafts.ts'
import { DIFFICULTY_LABEL } from '../types/task.ts'
import type { Task } from '../types/task.ts'
import { CodeEditor } from './CodeEditor.tsx'
import { DisabledRunCheck } from './DisabledRunCheck.tsx'
import { PythonKeypad } from './PythonKeypad.tsx'

type TaskScreenProps = {
  task: Task
  taskNumber: number
  taskCount: number
  onBack: () => void
}

function readInitialCode(taskId: string, starterCode: string): string {
  return loadStore(getBrowserStorage()).drafts[taskId]?.code ?? starterCode
}

function useVisualViewportHeight() {
  useEffect(() => {
    const root = document.documentElement
    const viewport = window.visualViewport

    function sync() {
      const height = viewport?.height ?? window.innerHeight
      root.style.setProperty('--app-height', `${Math.round(height)}px`)
    }

    sync()
    viewport?.addEventListener('resize', sync)
    viewport?.addEventListener('scroll', sync)
    window.addEventListener('resize', sync)

    return () => {
      viewport?.removeEventListener('resize', sync)
      viewport?.removeEventListener('scroll', sync)
      window.removeEventListener('resize', sync)
      root.style.removeProperty('--app-height')
    }
  }, [])
}

export function TaskScreen({ task, taskNumber, taskCount, onBack }: TaskScreenProps) {
  useVisualViewportHeight()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [history, setHistory] = useState(() =>
    createHistory(readInitialCode(task.id, task.starterCode)),
  )
  const lastSavedCode = useRef(history.present.value)
  const [promptOpen, setPromptOpen] = useState(true)

  useEffect(() => {
    const storage = getBrowserStorage()
    const next = markTaskOpened(loadStore(storage), task.id, task.starterCode, Date.now())
    persistStore(storage, next)
  }, [task.id, task.starterCode])

  useEffect(() => {
    const code = history.present.value
    if (code === lastSavedCode.current) {
      return
    }
    lastSavedCode.current = code
    const storage = getBrowserStorage()
    const next = saveDraftCode(
      loadStore(storage),
      task.id,
      code,
      task.starterCode,
      Date.now(),
    )
    persistStore(storage, next)
  }, [history.present.value, task.id, task.starterCode])

  function handleOp(op: HistoryOp) {
    setHistory((current) => applyHistory(current, op))
    textareaRef.current?.focus()
  }

  const hasDraft = history.present.value !== task.starterCode
  const number = String(taskNumber).padStart(2, '0')

  return (
    <div className="task-screen">
      <header className="task-header">
        <button type="button" className="back-button" onClick={onBack}>
          <svg className="back-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M14.5 5.5 8 12l6.5 6.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="visually-hidden">Назад</span>
        </button>
        <h1 className="task-title">
          {number} · {task.title}
        </h1>
        <p className="task-meta">
          <span className={`difficulty difficulty-${task.difficulty}`}>
            {DIFFICULTY_LABEL[task.difficulty]}
          </span>
          <span className="task-progress">
            {taskNumber}/{taskCount}
          </span>
        </p>
      </header>

      <section className={`prompt${promptOpen ? ' prompt-open' : ''}`}>
        <button
          type="button"
          className="prompt-toggle"
          aria-expanded={promptOpen}
          onClick={() => setPromptOpen((open) => !open)}
        >
          <span>Условие</span>
          <span className="prompt-toggle-action">
            {promptOpen ? 'Свернуть' : 'Открыть'}
          </span>
        </button>
        {promptOpen ? (
          <div className="prompt-body">
            <p className="prompt-text">{task.statement}</p>
            <ul className="examples">
              {task.examples.map((example, index) => (
                <li key={example.input} className="example">
                  <p className="example-label">Пример {index + 1}</p>
                  <div className="example-grid">
                    <pre className="example-block">
                      <span className="example-caption">Ввод</span>
                      {example.input}
                    </pre>
                    <pre className="example-block">
                      <span className="example-caption">Вывод</span>
                      {example.output}
                    </pre>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <div className="editor-zone">
        <CodeEditor
          snapshot={history.present}
          textareaRef={textareaRef}
          onFocus={() => setPromptOpen(false)}
          onInput={(value, selectionStart, selectionEnd) => {
            setHistory((current) =>
              commitChange(current, { value, selectionStart, selectionEnd }),
            )
          }}
          onSelectRange={(selectionStart, selectionEnd) => {
            setHistory((current) => {
              if (
                current.present.selectionStart === selectionStart &&
                current.present.selectionEnd === selectionEnd
              ) {
                return current
              }
              return {
                ...current,
                present: {
                  ...current.present,
                  selectionStart,
                  selectionEnd,
                },
              }
            })
          }}
          onOp={handleOp}
        />
        <p className="editor-status" aria-live="polite">
          {hasDraft ? 'Черновик сохранён' : 'Стартовый код'}
        </p>
      </div>

      <footer className="task-dock">
        <PythonKeypad
          onOp={handleOp}
          canUndo={canUndo(history)}
          canRedo={canRedo(history)}
        />
        <DisabledRunCheck />
      </footer>
    </div>
  )
}
