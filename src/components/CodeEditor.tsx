import { useLayoutEffect, type KeyboardEvent, type RefObject } from 'react'
import type { EditorSnapshot, HistoryOp } from '../editor/types.ts'

type CodeEditorProps = {
  snapshot: EditorSnapshot
  textareaRef: RefObject<HTMLTextAreaElement | null>
  onInput: (value: string, selectionStart: number, selectionEnd: number) => void
  onSelectRange: (selectionStart: number, selectionEnd: number) => void
  onOp: (op: HistoryOp) => void
  onFocus?: () => void
}

export function CodeEditor({
  snapshot,
  textareaRef,
  onInput,
  onSelectRange,
  onOp,
  onFocus,
}: CodeEditorProps) {
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
    <div className="editor">
      <label className="visually-hidden" htmlFor="python-editor">
        Код Python
      </label>
      <textarea
        id="python-editor"
        ref={textareaRef}
        className="editor-input"
        value={snapshot.value}
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
        onFocus={onFocus}
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
