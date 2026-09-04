import type { HistoryOp } from './types.ts'

export type KeypadKey = {
  id: string
  label: string
  ariaLabel: string
  op: HistoryOp
}

export const KEYPAD_KEYS: readonly KeypadKey[] = [
  { id: 'tab', label: 'Tab', ariaLabel: 'Табуляция, четыре пробела', op: { kind: 'tab' } },
  { id: 'left', label: '←', ariaLabel: 'Курсор влево', op: { kind: 'move', delta: -1 } },
  { id: 'right', label: '→', ariaLabel: 'Курсор вправо', op: { kind: 'move', delta: 1 } },
  { id: 'print', label: 'print()', ariaLabel: 'Шаблон print', op: { kind: 'template', id: 'print' } },
  { id: 'lparen', label: '(', ariaLabel: 'Открывающая скобка', op: { kind: 'pair', open: '(', close: ')' } },
  { id: 'rparen', label: ')', ariaLabel: 'Закрывающая скобка', op: { kind: 'insert', text: ')' } },
  { id: 'colon', label: ':', ariaLabel: 'Двоеточие', op: { kind: 'insert', text: ':' } },
  { id: 'eq', label: '=', ariaLabel: 'Равно', op: { kind: 'insert', text: '=' } },
  { id: 'lbracket', label: '[', ariaLabel: 'Открывающая квадратная скобка', op: { kind: 'pair', open: '[', close: ']' } },
  { id: 'rbracket', label: ']', ariaLabel: 'Закрывающая квадратная скобка', op: { kind: 'insert', text: ']' } },
  { id: 'squote', label: "'", ariaLabel: 'Одинарная кавычка', op: { kind: 'pair', open: "'", close: "'" } },
  { id: 'dquote', label: '"', ariaLabel: 'Двойная кавычка', op: { kind: 'pair', open: '"', close: '"' } },
  { id: 'lt', label: '<', ariaLabel: 'Меньше', op: { kind: 'insert', text: '<' } },
  { id: 'gt', label: '>', ariaLabel: 'Больше', op: { kind: 'insert', text: '>' } },
  { id: 'for', label: 'for', ariaLabel: 'Шаблон for', op: { kind: 'template', id: 'for' } },
  { id: 'if', label: 'if', ariaLabel: 'Шаблон if', op: { kind: 'template', id: 'if' } },
  { id: 'while', label: 'while', ariaLabel: 'Шаблон while', op: { kind: 'template', id: 'while' } },
  { id: 'range', label: 'range()', ariaLabel: 'Шаблон range', op: { kind: 'template', id: 'range' } },
]
