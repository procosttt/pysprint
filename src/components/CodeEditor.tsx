import { useLayoutEffect, useRef, useState, type KeyboardEvent, type RefObject } from 'react'
import { editorHint } from '../editor/status.ts'
import { historyShortcut } from '../editor/shortcuts.ts'
import { CODE_MAX_LENGTH } from '../python/protocol.ts'
import type { EditorSnapshot, HistoryOp } from '../editor/types.ts'

type CodeEditorProps = {
  snapshot: EditorSnapshot
  textareaRef: RefObject<HTMLTextAreaElement | null>
  hasDraft: boolean
  canUndo: boolean
  canRedo: boolean
  onInput: (value: string, selectionStart: number, selectionEnd: number) => void
  onSelectRange: (selectionStart: number, selectionEnd: number) => void
  onOp: (op: HistoryOp) => void
}

function HistoryButton({
  label,
  ariaLabel,
  disabled,
  op,
  onOp,
}: {
  label: string
  ariaLabel: string
  disabled: boolean
  op: HistoryOp
  onOp: (op: HistoryOp) => void
}) {
  const skipClickRef = useRef(false)

  return (
    <button
      type="button"
      className="editor-history-button"
      aria-label={ariaLabel}
      disabled={disabled}
      onPointerDown={(event) => {
        if (disabled || event.button !== 0) {
          return
        }
        event.preventDefault()
        skipClickRef.current = true
        onOp(op)
      }}
      onMouseDown={(event) => {
        event.preventDefault()
      }}
      onClick={(event) => {
        if (skipClickRef.current) {
          event.preventDefault()
          skipClickRef.current = false
          return
        }
        if (disabled) {
          return
        }
        onOp(op)
      }}
    >
      {label}
    </button>
  )
}

export function CodeEditor({
  snapshot,
  textareaRef,
  hasDraft,
  canUndo,
  canRedo,
  onInput,
  onSelectRange,
  onOp,
}: CodeEditorProps) {
  const [focused, setFocused] = useState(false)

  useLayoutEffect(() => {
    const element = textareaRef.current
    if (!element) {
      return
    }
    if (
      element.selectionStart !== snapshot.selectionStart ||
      element.selectionEnd !== snapshot.selectionEnd
    ) {
      element.setSelectionRange(snapshot.selectionStart, snapshot.selectionEnd)
    }
  }, [snapshot, textareaRef])

  function focusEditor() {
    textareaRef.current?.focus()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.nativeEvent.isComposing) {
      return
    }

    const shortcut = historyShortcut(event)
    if (shortcut) {
      event.preventDefault()
      onOp({ kind: shortcut })
      return
    }

    if (event.key === 'Tab') {
      event.preventDefault()
      onOp({ kind: 'tab' })
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      onOp({ kind: 'enter' })
    }
  }

  return (
    <div
      className={`editor${focused ? ' editor-focused' : ''}`}
      onPointerDown={(event) => {
        if (event.target === textareaRef.current) {
          return
        }
        if ((event.target as HTMLElement).closest('.editor-history-button')) {
          return
        }
        event.preventDefault()
        focusEditor()
      }}
    >
      <div className="editor-chrome">
        <span className="editor-kicker">КОД</span>
        <span className="editor-hint" aria-live="polite">
          {editorHint(hasDraft)}
        </span>
        <HistoryButton
          label="↶"
          ariaLabel="Отменить последнее изменение"
          disabled={!canUndo}
          op={{ kind: 'undo' }}
          onOp={onOp}
        />
        <HistoryButton
          label="↷"
          ariaLabel="Вернуть отменённое изменение"
          disabled={!canRedo}
          op={{ kind: 'redo' }}
          onOp={onOp}
        />
      </div>
      <label className="visually-hidden" htmlFor="python-editor">
        Код Python
      </label>
      <textarea
        id="python-editor"
        ref={textareaRef}
        className="editor-input"
        value={snapshot.value}
        placeholder="Напишите Python-код здесь…"
        maxLength={CODE_MAX_LENGTH}
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
        autoComplete="off"
        lang="en"
        wrap="off"
        enterKeyHint="enter"
        aria-label="Код Python"
        onChange={(event) => {
          const target = event.target
          onInput(target.value, target.selectionStart, target.selectionEnd)
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onSelect={(event) => {
          const target = event.currentTarget
          onSelectRange(target.selectionStart, target.selectionEnd)
        }}
        onKeyDown={handleKeyDown}
      />
    </div>
  )
}
