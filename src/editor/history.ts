import type { EditorHistory, EditorSnapshot } from './types.ts'

export const MAX_HISTORY = 100

export function createSnapshot(value: string, cursor = value.length): EditorSnapshot {
  return {
    value,
    selectionStart: cursor,
    selectionEnd: cursor,
  }
}

export function createHistory(value: string): EditorHistory {
  return {
    past: [],
    present: createSnapshot(value),
    future: [],
  }
}

export function snapshotsEqual(a: EditorSnapshot, b: EditorSnapshot): boolean {
  return (
    a.value === b.value &&
    a.selectionStart === b.selectionStart &&
    a.selectionEnd === b.selectionEnd
  )
}

export function commitChange(
  history: EditorHistory,
  next: EditorSnapshot,
): EditorHistory {
  if (history.present.value === next.value) {
    if (snapshotsEqual(history.present, next)) {
      return history
    }
    return {
      ...history,
      present: next,
    }
  }

  return {
    past: [...history.past, history.present].slice(-MAX_HISTORY),
    present: next,
    future: [],
  }
}

export function undo(history: EditorHistory): EditorHistory {
  if (history.past.length === 0) {
    return history
  }

  const previous = history.past[history.past.length - 1]
  if (!previous) {
    return history
  }
  return {
    past: history.past.slice(0, -1),
    present: previous,
    future: [history.present, ...history.future],
  }
}

export function redo(history: EditorHistory): EditorHistory {
  if (history.future.length === 0) {
    return history
  }

  const next = history.future[0]
  if (!next) {
    return history
  }
  return {
    past: [...history.past, history.present],
    present: next,
    future: history.future.slice(1),
  }
}

export function canUndo(history: EditorHistory): boolean {
  return history.past.length > 0
}

export function canRedo(history: EditorHistory): boolean {
  return history.future.length > 0
}
