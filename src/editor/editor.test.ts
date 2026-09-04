import { describe, expect, it } from 'vitest'
import { applyHistory } from './apply.ts'
import { commitChange, createHistory, createSnapshot, MAX_HISTORY } from './history.ts'
import {
  insertPair,
  insertTab,
  insertText,
  smartEnter,
  wrapSelection,
} from './operations.ts'
import { insertTemplate, TEMPLATES } from './templates.ts'
import { TEMPLATE_IDS } from './types.ts'
import type { EditorHistory, EditorSnapshot, TemplateId } from './types.ts'
import { KEYPAD_KEYS } from './keypad.ts'
import { historyShortcut } from './shortcuts.ts'
import { editorHint } from './status.ts'
import { initialPromptOpen } from '../state/prompt.ts'

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
})

describe('editor history', () => {
  it('undoes text and cursor, then redoes them', () => {
    let history = createHistory('ab')
    history = applyHistory(history, { kind: 'insert', text: 'c' })
    expect(history.present).toEqual(createSnapshot('abc'))

    history = applyHistory(history, { kind: 'undo' })
    expect(history.present).toEqual(createSnapshot('ab'))

    history = applyHistory(history, { kind: 'redo' })
    expect(history.present).toEqual(createSnapshot('abc'))
  })

  it('clears redo after a new change following undo', () => {
    let history = createHistory('a')
    history = applyHistory(history, { kind: 'insert', text: 'b' })
    history = applyHistory(history, { kind: 'undo' })
    history = applyHistory(history, { kind: 'insert', text: 'c' })
    expect(history.present.value).toBe('ac')
    expect(history.future).toEqual([])

    history = applyHistory(history, { kind: 'redo' })
    expect(history.present.value).toBe('ac')
  })

  it('caps past snapshots at 100', () => {
    let history = createHistory('')
    for (let index = 1; index <= 120; index += 1) {
      history = commitChange(history, createSnapshot('x'.repeat(index)))
    }
    expect(history.past).toHaveLength(MAX_HISTORY)
    expect(history.present.value).toHaveLength(120)
  })

  it('puts keypad operations into the same history', () => {
    let history: EditorHistory = {
      past: [],
      present: snap('xy', 0, 2),
      future: [],
    }
    history = applyHistory(history, { kind: 'pair', open: '(', close: ')' })
    history = applyHistory(history, { kind: 'tab' })
    history = applyHistory(history, { kind: 'template', id: 'print' })
    history = applyHistory(history, { kind: 'enter' })
    const afterOps = history.present

    history = applyHistory(history, { kind: 'undo' })
    expect(history.present.value).not.toBe(afterOps.value)

    history = applyHistory(history, { kind: 'redo' })
    expect(history.present).toEqual(afterOps)
  })
})

describe('keypad layout data', () => {
  it('keeps the first visible keys in the required order', () => {
    expect(KEYPAD_KEYS.map((key) => key.label).slice(8)).toEqual([
      '[',
      ']',
      "'",
      '"',
      '<',
      '>',
      'for',
      'if',
      'while',
      'range()',
    ])
  })

  it('does not put undo or redo on the Python ribbon', () => {
    const ids = KEYPAD_KEYS.map((key) => key.id)
    const labels = KEYPAD_KEYS.map((key) => key.label)
    expect(ids).not.toContain('undo')
    expect(ids).not.toContain('redo')
    expect(labels).not.toContain('Undo')
    expect(labels).not.toContain('Redo')
    expect(labels).not.toContain('↶')
    expect(labels).not.toContain('↷')
  })

  it('does not expose input() keypad keys', () => {
    const labels = KEYPAD_KEYS.map((key) => key.label)
    expect(labels).not.toContain('input()')
    expect(labels).not.toContain('int(input())')
  })
})

describe('history shortcuts', () => {
  it('maps Ctrl/Cmd Z Y and Shift+Z without leaving room for native undo', () => {
    expect(
      historyShortcut({ key: 'z', ctrlKey: true, metaKey: false, shiftKey: false }),
    ).toBe('undo')
    expect(
      historyShortcut({ key: 'z', ctrlKey: false, metaKey: true, shiftKey: false }),
    ).toBe('undo')
    expect(
      historyShortcut({ key: 'y', ctrlKey: true, metaKey: false, shiftKey: false }),
    ).toBe('redo')
    expect(
      historyShortcut({ key: 'z', ctrlKey: true, metaKey: false, shiftKey: true }),
    ).toBe('redo')
    expect(
      historyShortcut({ key: 'z', ctrlKey: false, metaKey: true, shiftKey: true }),
    ).toBe('redo')
    expect(
      historyShortcut({ key: 'z', ctrlKey: false, metaKey: false, shiftKey: false }),
    ).toBe(null)
  })
})

describe('editor chrome copy', () => {
  it('shows a compact saved label only when a draft exists', () => {
    expect(editorHint(false)).toBe('')
    expect(editorHint(true)).toBe('Сохранено')
  })
})

describe('task prompt open state', () => {
  it('opens the prompt for a new unused task', () => {
    expect(initialPromptOpen('', '')).toBe(true)
    expect(initialPromptOpen('print()\n', 'print()\n')).toBe(true)
  })

  it('keeps the prompt closed when a draft already exists', () => {
    expect(initialPromptOpen('print(1)', '')).toBe(false)
  })

  it('does not change editor code when prompt visibility is toggled', () => {
    const history = applyHistory(createHistory(''), { kind: 'insert', text: 'print(1)' })
    const snapshot = history.present
    expect(initialPromptOpen(snapshot.value, '')).toBe(false)
    expect(history.present).toEqual(snapshot)
    expect(history.present.value).toBe('print(1)')
  })
})
