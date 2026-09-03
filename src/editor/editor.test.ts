import { describe, expect, it } from 'vitest'
import { applyHistory } from './apply.ts'
import { createHistory, createSnapshot } from './history.ts'
import {
  insertPair,
  insertTab,
  insertText,
  smartEnter,
  wrapSelection,
} from './operations.ts'
import { insertTemplate, TEMPLATES } from './templates.ts'
import { TEMPLATE_IDS } from './types.ts'
import type { EditorSnapshot, TemplateId } from './types.ts'
import { KEYPAD_ACTIONS, KEYPAD_RIBBON } from './keypad.ts'
import { editorHint } from './status.ts'

function snap(value: string, start: number, end = start): EditorSnapshot {
  return {
    value,
    selectionStart: start,
    selectionEnd: end,
  }
}

function cursorOffset(templateId: TemplateId): number {
  return TEMPLATES[templateId].indexOf('|')
}

describe('editor operations', () => {
  it('inserts a character at the cursor', () => {
    expect(insertText(snap('ab', 1), 'X')).toEqual(snap('aXb', 2))
  })

  it('replaces the selected text', () => {
    expect(insertText(snap('abcd', 1, 3), 'XY')).toEqual(snap('aXYd', 3))
  })

  it('wraps the selection with paired characters', () => {
    expect(wrapSelection(snap('xy', 0, 2), '(', ')')).toEqual(snap('(xy)', 1, 3))
    expect(wrapSelection(snap('xy', 0, 2), '[', ']')).toEqual(snap('[xy]', 1, 3))
    expect(wrapSelection(snap('xy', 0, 2), '{', '}')).toEqual(snap('{xy}', 1, 3))
    expect(wrapSelection(snap('xy', 0, 2), '"', '"')).toEqual(snap('"xy"', 1, 3))
    expect(wrapSelection(snap('xy', 0, 2), "'", "'")).toEqual(snap("'xy'", 1, 3))
  })

  it('inserts a pair without a selection and places the cursor inside', () => {
    expect(insertPair(snap('ab', 1), '(', ')')).toEqual(snap('a()b', 2))
    expect(insertPair(snap('ab', 1), '[', ']')).toEqual(snap('a[]b', 2))
    expect(insertPair(snap('ab', 1), '{', '}')).toEqual(snap('a{}b', 2))
    expect(insertPair(snap('ab', 1), '"', '"')).toEqual(snap('a""b', 2))
    expect(insertPair(snap('', 0), "'", "'")).toEqual(snap("''", 1))
  })

  it('inserts each template with a useful cursor position', () => {
    for (const id of TEMPLATE_IDS) {
      const result = insertTemplate(snap('left right', 5), id)
      const expectedText = TEMPLATES[id].replace('|', '')
      expect(result.value).toBe(`left ${expectedText}right`)
      expect(result.selectionStart).toBe(5 + cursorOffset(id))
      expect(result.selectionEnd).toBe(5 + cursorOffset(id))
    }

    expect(insertTemplate(snap('', 0), 'for')).toEqual(
      snap('for i in range():', 'for i in range('.length),
    )
    expect(insertTemplate(snap('', 0), 'if')).toEqual(snap('if :', 3))
    expect(insertTemplate(snap('', 0), 'while')).toEqual(snap('while :', 6))
    expect(insertTemplate(snap('', 0), 'print')).toEqual(snap('print()', 6))
    expect(insertTemplate(snap('', 0), 'input')).toEqual(snap('input()', 6))
    expect(insertTemplate(snap('', 0), 'intInput')).toEqual(
      snap('int(input())', 'int(input('.length),
    )
    expect(insertTemplate(snap('', 0), 'range')).toEqual(snap('range()', 6))
  })

  it('inserts four spaces for Tab', () => {
    expect(insertTab(snap('x', 1))).toEqual(snap('x    ', 5))
    expect(insertTab(snap('abcd', 1, 3))).toEqual(snap('a    d', 5))
  })

  it('keeps the current indent on Enter', () => {
    const value = '    x = 1'
    expect(smartEnter(snap(value, value.length))).toEqual(
      snap('    x = 1\n    ', '    x = 1\n    '.length),
    )
  })

  it('adds four extra spaces after a line that ends with a colon', () => {
    const value = '    if x:'
    expect(smartEnter(snap(value, value.length))).toEqual(
      snap('    if x:\n        ', '    if x:\n        '.length),
    )
  })

  it('undoes and redoes editor changes', () => {
    let history = createHistory('a')
    history = applyHistory(history, { kind: 'insert', text: 'b' })
    expect(history.present).toEqual(createSnapshot('ab'))

    history = applyHistory(history, { kind: 'tab' })
    expect(history.present.value).toBe('ab    ')

    history = applyHistory(history, { kind: 'undo' })
    expect(history.present.value).toBe('ab')

    history = applyHistory(history, { kind: 'undo' })
    expect(history.present.value).toBe('a')

    history = applyHistory(history, { kind: 'redo' })
    expect(history.present.value).toBe('ab')

    history = applyHistory(history, { kind: 'redo' })
    expect(history.present.value).toBe('ab    ')
  })
})

describe('keypad layout data', () => {
  it('puts navigation keys on the fixed row and frequent symbols first on the ribbon', () => {
    expect(KEYPAD_ACTIONS.map((key) => key.id)).toEqual([
      'tab',
      'left',
      'right',
      'undo',
      'redo',
    ])
    expect(KEYPAD_RIBBON.map((key) => key.label).slice(0, 8)).toEqual([
      '(',
      ')',
      ':',
      '=',
      '[',
      ']',
      "'",
      '"',
    ])
  })
})

describe('editor chrome copy', () => {
  it('explains how to start typing and how the draft is saved', () => {
    expect(editorHint(false, false)).toBe('Нажмите, чтобы печатать')
    expect(editorHint(true, false)).toBe('Редактирование')
    expect(editorHint(false, true)).toBe('Черновик сохранён')
  })
})
