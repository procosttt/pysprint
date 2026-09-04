import { useLayoutEffect, useState, type KeyboardEvent, type RefObject } from 'react'
import { editorHint } from '../editor/status.ts'
import { CODE_MAX_LENGTH } from '../python/protocol.ts'
import type { EditorSnapshot, HistoryOp } from '../editor/types.ts'

type CodeEditorProps = {
  snapshot: EditorSnapshot
  textareaRef: RefObject<HTMLTextAreaElement | null>
  hasDraft: boolean
  onInput: (value: string, selectionStart: number, selectionEnd: number) => void
  onSelectRange: (selectionStart: number, selectionEnd: number) => void
  onOp: (op: HistoryOp) => void
  onFocus?: () => void
}

export function CodeEditor({
  snapshot,
  textareaRef,
  hasDraft,
  onInput,
  onSelectRange,
  onOp,
  onFocus,
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
        event.preventDefault()
        focusEditor()
      }}
    >
      <div className="editor-chrome">
        <span className="editor-kicker">КОД</span>
        <span className="editor-hint" aria-live="polite">{editorHint(hasDraft)}</span>
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
        onFocus={() => {
          setFocused(true)
          onFocus?.()
        }}
        onBlur={() => setFocused(false)}
        onPointerDown={onFocus}
        onSelect={(event) => {
          const target = event.currentTarget
          onSelectRange(target.selectionStart, target.selectionEnd)
        }}
        onKeyDown={handleKeyDown}
      />
    </div>
  )
}
