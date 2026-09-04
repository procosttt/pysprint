import type { HistoryOp } from './types.ts'

export type KeypadGroup = 'actions' | 'ribbon'

export type KeypadKey = {
  id: string
  label: string
  ariaLabel: string
  group: KeypadGroup
  op: HistoryOp
}

export const KEYPAD_KEYS: readonly KeypadKey[] = [
  { id: 'tab', label: 'Tab', ariaLabel: 'Табуляция, четыре пробела', group: 'actions', op: { kind: 'tab' } },
  { id: 'left', label: '←', ariaLabel: 'Курсор влево', group: 'actions', op: { kind: 'move', delta: -1 } },
  { id: 'right', label: '→', ariaLabel: 'Курсор вправо', group: 'actions', op: { kind: 'move', delta: 1 } },
  { id: 'undo', label: 'Undo', ariaLabel: 'Отменить', group: 'actions', op: { kind: 'undo' } },
  { id: 'redo', label: 'Redo', ariaLabel: 'Повторить', group: 'actions', op: { kind: 'redo' } },
  { id: 'print', label: 'print()', ariaLabel: 'Шаблон print', group: 'ribbon', op: { kind: 'template', id: 'print' } },
  { id: 'lparen', label: '(', ariaLabel: 'Открывающая скобка', group: 'ribbon', op: { kind: 'pair', open: '(', close: ')' } },
  { id: 'rparen', label: ')', ariaLabel: 'Закрывающая скобка', group: 'ribbon', op: { kind: 'insert', text: ')' } },
  { id: 'lbracket', label: '[', ariaLabel: 'Открывающая квадратная скобка', group: 'ribbon', op: { kind: 'pair', open: '[', close: ']' } },
  { id: 'rbracket', label: ']', ariaLabel: 'Закрывающая квадратная скобка', group: 'ribbon', op: { kind: 'insert', text: ']' } },
  { id: 'colon', label: ':', ariaLabel: 'Двоеточие', group: 'ribbon', op: { kind: 'insert', text: ':' } },
  { id: 'eq', label: '=', ariaLabel: 'Равно', group: 'ribbon', op: { kind: 'insert', text: '=' } },
  { id: 'squote', label: "'", ariaLabel: 'Одинарная кавычка', group: 'ribbon', op: { kind: 'pair', open: "'", close: "'" } },
  { id: 'dquote', label: '"', ariaLabel: 'Двойная кавычка', group: 'ribbon', op: { kind: 'pair', open: '"', close: '"' } },
  { id: 'lt', label: '<', ariaLabel: 'Меньше', group: 'ribbon', op: { kind: 'insert', text: '<' } },
  { id: 'gt', label: '>', ariaLabel: 'Больше', group: 'ribbon', op: { kind: 'insert', text: '>' } },
  { id: 'for', label: 'for', ariaLabel: 'Шаблон for', group: 'ribbon', op: { kind: 'template', id: 'for' } },
  { id: 'if', label: 'if', ariaLabel: 'Шаблон if', group: 'ribbon', op: { kind: 'template', id: 'if' } },
  { id: 'while', label: 'while', ariaLabel: 'Шаблон while', group: 'ribbon', op: { kind: 'template', id: 'while' } },
  { id: 'range', label: 'range()', ariaLabel: 'Шаблон range', group: 'ribbon', op: { kind: 'template', id: 'range' } },
]

export const KEYPAD_ACTIONS = KEYPAD_KEYS.filter((key) => key.group === 'actions')
export const KEYPAD_RIBBON = KEYPAD_KEYS.filter((key) => key.group === 'ribbon')
