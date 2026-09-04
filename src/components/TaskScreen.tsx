import { useEffect, useRef, useState } from 'react'
import { applyHistory } from '../editor/apply.ts'
import { canRedo, canUndo, commitChange, createHistory } from '../editor/history.ts'
import type { HistoryOp } from '../editor/types.ts'
import { offsetAtLine } from '../python/errors.ts'
import type { PythonRunner, RunnerState } from '../python/PythonRunner.ts'
import {
  getBrowserStorage,
  loadStore,
  markTaskOpened,
  persistStore,
  saveDraftCode,
} from '../storage/drafts.ts'
import { DIFFICULTY_LABEL, prototypeScreenLabel } from '../types/task.ts'
import type { Task, TruthTableFragment } from '../types/task.ts'
import { CodeEditor } from './CodeEditor.tsx'
import { ConsolePanel } from './ConsolePanel.tsx'
import { PythonKeypad } from './PythonKeypad.tsx'
import { RunControls } from './RunControls.tsx'

type TaskScreenProps = {
  task: Task
  taskNumber: number
  taskCount: number
  onBack: () => void
  onContinue: () => void
  python: {
    runner: PythonRunner | null
    state: RunnerState
  }
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

function TruthTable({ table }: { table: TruthTableFragment }) {
  return (
    <div className="truth-wrap">
      <table className="truth-table">
        <caption className="truth-caption">Фрагмент таблицы истинности</caption>
        <thead>
          <tr>
            <th scope="col">
              <span className="visually-hidden">Столбец 1</span>
            </th>
            <th scope="col">
              <span className="visually-hidden">Столбец 2</span>
            </th>
            <th scope="col">
              <span className="visually-hidden">Столбец 3</span>
            </th>
            <th scope="col">
              <span className="visually-hidden">Столбец 4</span>
            </th>
            <th scope="col">F</th>
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>{cell === null ? '' : cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
function scrollTextareaToLine(element: HTMLTextAreaElement, lineNumber: number) {
  const style = window.getComputedStyle(element)
  const fontSize = Number.parseFloat(style.fontSize) || 16
  const parsedLineHeight = Number.parseFloat(style.lineHeight)
  const lineHeight = Number.isFinite(parsedLineHeight) ? parsedLineHeight : fontSize * 1.45
  const paddingTop = Number.parseFloat(style.paddingTop) || 0
  const targetTop = paddingTop + (lineNumber - 1) * lineHeight
  element.scrollTop = Math.max(0, targetTop - element.clientHeight / 3)
}

export function TaskScreen({
  task,
  taskNumber,
  taskCount,
  onBack,
  onContinue,
  python,
}: TaskScreenProps) {
  useVisualViewportHeight()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [history, setHistory] = useState(() =>
    createHistory(readInitialCode(task.id, task.starterCode)),
  )
  const lastSavedCode = useRef(history.present.value)
  const [promptOpen, setPromptOpen] = useState(true)
  const [outputOpen, setOutputOpen] = useState(true)

  useEffect(() => {
    const storage = getBrowserStorage()
    const next = markTaskOpened(loadStore(storage), task.id, task.starterCode, Date.now())
    persistStore(storage, next)
  }, [task.id, task.starterCode])

  useEffect(() => {
    python.runner?.clearOutput()
  }, [task.id, python.runner])

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

  function handleGoToCode() {
    setPromptOpen(false)
    textareaRef.current?.focus()
  }

  function handleOp(op: HistoryOp) {
    setHistory((current) => applyHistory(current, op))
    textareaRef.current?.focus()
  }

  function handleRun() {
    setPromptOpen(false)
    setOutputOpen(true)
    python.runner?.run(history.present.value, '')
  }

  function handleGoToLine(line: number) {
    const offset = offsetAtLine(history.present.value, line)
    setHistory((current) => ({
      ...current,
      present: {
        ...current.present,
        selectionStart: offset,
        selectionEnd: offset,
      },
    }))
    const element = textareaRef.current
    if (!element) {
      return
    }
    element.focus()
    element.setSelectionRange(offset, offset)
    scrollTextareaToLine(element, line)
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
            {promptOpen ? 'Свернуть' : 'Открыть условие'}
          </span>
        </button>
        {promptOpen ? (
          <>
            <div className="prompt-body">
              {task.prototypeNumber ? (
                <p className="prototype-caption">{prototypeScreenLabel(task.prototypeNumber)}</p>
              ) : null}
              <p className="prompt-text">{task.statement}</p>
              {task.truthTable ? <TruthTable table={task.truthTable} /> : null}
              {task.prototypeNumber ? (
                <p className="prototype-disclaimer">
                  Авторская задача по формату ЕГЭ. Не является официальным заданием ФИПИ.
                </p>
              ) : null}
            </div>
            <button type="button" className="go-to-code" onClick={handleGoToCode}>
              Перейти к коду
            </button>
          </>
        ) : null}
      </section>

      <div className="editor-zone">
        <CodeEditor
          snapshot={history.present}
          textareaRef={textareaRef}
          hasDraft={hasDraft}
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
      </div>

      <ConsolePanel
        outputOpen={outputOpen}
        onToggleOutput={() => setOutputOpen((open) => !open)}
        state={python.state}
        onGoToLine={handleGoToLine}
      />

      {python.state.result && python.state.status !== 'running' ? (
        <button type="button" className="next-task" onClick={onContinue}>
          {taskNumber === taskCount ? 'К списку задач' : 'Следующая задача →'}
        </button>
      ) : null}

      <footer className="task-dock">
        <PythonKeypad
          onOp={handleOp}
          canUndo={canUndo(history)}
          canRedo={canRedo(history)}
        />
        <RunControls
          canRun={python.state.canRun}
          canStop={python.state.canStop}
          loadingPython={python.state.loadingPython}
          loadError={python.state.status === 'load-error'}
          onRun={handleRun}
          onStop={() => python.runner?.stop()}
          onRetryLoad={() => python.runner?.retryLoad()}
        />
      </footer>
    </div>
  )
}
