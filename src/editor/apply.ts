import { commitChange, redo, undo } from './history.ts'
import {
  insertOrWrapPair,
  insertTab,
  insertText,
  moveCursor,
  smartEnter,
} from './operations.ts'
import { insertTemplate } from './templates.ts'
import type { EditorHistory, EditorSnapshot, HistoryOp, SnapshotOp } from './types.ts'

export function applySnapshotOp(
  snapshot: EditorSnapshot,
  op: SnapshotOp,
): EditorSnapshot {
  switch (op.kind) {
    case 'insert':
      return insertText(snapshot, op.text)
    case 'pair':
      return insertOrWrapPair(snapshot, op.open, op.close)
    case 'tab':
      return insertTab(snapshot)
    case 'enter':
      return smartEnter(snapshot)
    case 'move':
      return moveCursor(snapshot, op.delta)
    case 'template':
      return insertTemplate(snapshot, op.id)
  }
}

export function applyHistory(history: EditorHistory, op: HistoryOp): EditorHistory {
  if (op.kind === 'undo') {
    return undo(history)
  }
  if (op.kind === 'redo') {
    return redo(history)
  }
  return commitChange(history, applySnapshotOp(history.present, op))
}
