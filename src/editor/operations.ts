import type { EditorSnapshot } from './types.ts'
import { TAB_SPACES } from './types.ts'

export function rangeOf(snapshot: EditorSnapshot): { start: number; end: number } {
  const start = Math.min(snapshot.selectionStart, snapshot.selectionEnd)
  const end = Math.max(snapshot.selectionStart, snapshot.selectionEnd)
  return { start, end }
}

export function insertText(snapshot: EditorSnapshot, text: string): EditorSnapshot {
  const { start, end } = rangeOf(snapshot)
  const value = snapshot.value.slice(0, start) + text + snapshot.value.slice(end)
  const cursor = start + text.length
  return {
    value,
    selectionStart: cursor,
    selectionEnd: cursor,
  }
}

export function wrapSelection(
  snapshot: EditorSnapshot,
  open: string,
  close: string,
): EditorSnapshot {
  const { start, end } = rangeOf(snapshot)
  const selected = snapshot.value.slice(start, end)
  const value =
    snapshot.value.slice(0, start) + open + selected + close + snapshot.value.slice(end)
  return {
    value,
    selectionStart: start + open.length,
    selectionEnd: start + open.length + selected.length,
  }
}

export function insertPair(
  snapshot: EditorSnapshot,
  open: string,
  close: string,
): EditorSnapshot {
  const { start, end } = rangeOf(snapshot)
  const value = snapshot.value.slice(0, start) + open + close + snapshot.value.slice(end)
  const cursor = start + open.length
  return {
    value,
    selectionStart: cursor,
    selectionEnd: cursor,
  }
}

export function insertOrWrapPair(
  snapshot: EditorSnapshot,
  open: string,
  close: string,
): EditorSnapshot {
  const { start, end } = rangeOf(snapshot)
  if (start === end) {
    return insertPair(snapshot, open, close)
  }
  return wrapSelection(snapshot, open, close)
}

export function insertTab(snapshot: EditorSnapshot): EditorSnapshot {
  return insertText(snapshot, TAB_SPACES)
}

export function smartEnter(snapshot: EditorSnapshot): EditorSnapshot {
  const { start } = rangeOf(snapshot)
  const lineStart = snapshot.value.lastIndexOf('\n', start - 1) + 1
  const currentLine = snapshot.value.slice(lineStart, start)
  const indentMatch = currentLine.match(/^ */)
  const indent = indentMatch ? indentMatch[0] : ''
  const trimmedRight = currentLine.replace(/[ \t]+$/, '')
  const extra = trimmedRight.endsWith(':') ? TAB_SPACES : ''
  return insertText(snapshot, `\n${indent}${extra}`)
}

export function moveCursor(snapshot: EditorSnapshot, delta: number): EditorSnapshot {
  const { start, end } = rangeOf(snapshot)
  const origin = delta < 0 ? start : end
  const next = Math.max(0, Math.min(snapshot.value.length, origin + delta))
  return {
    value: snapshot.value,
    selectionStart: next,
    selectionEnd: next,
  }
}
