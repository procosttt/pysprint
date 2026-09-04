export type EditorSnapshot = {
  value: string
  selectionStart: number
  selectionEnd: number
}

export type EditorHistory = {
  past: EditorSnapshot[]
  present: EditorSnapshot
  future: EditorSnapshot[]
}

export const TEMPLATE_IDS = ['for', 'if', 'while', 'print', 'range'] as const

export type TemplateId = (typeof TEMPLATE_IDS)[number]

export type SnapshotOp =
  | { kind: 'insert'; text: string }
  | { kind: 'pair'; open: string; close: string }
  | { kind: 'tab' }
  | { kind: 'enter' }
  | { kind: 'move'; delta: number }
  | { kind: 'template'; id: TemplateId }

export type HistoryOp = SnapshotOp | { kind: 'undo' } | { kind: 'redo' }

export const TAB_SPACES = '    '
export const CURSOR_MARK = '|'
