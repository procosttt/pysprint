import { describe, expect, it } from 'vitest'
import { emptyStore, saveDraftCode } from '../storage/drafts.ts'
import { TASKS } from '../data/tasks.ts'
import { getContinueTaskId, hasSessionProgress, homeCtaLabel } from './navigation.ts'

describe('home navigation', () => {
  it('uses the start-first-task CTA when nothing has been written', () => {
    const opened = {
      ...emptyStore(),
      lastOpenedTaskId: 'track-total',
      drafts: {
        'track-total': {
          code: '',
          updatedAt: null,
          lastOpenedAt: 10,
          isUserDraft: false,
        },
      },
    }

    expect(hasSessionProgress(opened)).toBe(false)
    expect(homeCtaLabel(TASKS, opened)).toBe('Начать первую задачу')
    expect(getContinueTaskId(TASKS, opened)).toBe('track-total')
    expect(homeCtaLabel(TASKS, emptyStore())).toBe('Начать первую задачу')
  })

  it('continues the named task when a real user draft exists', () => {
    const store = saveDraftCode(emptyStore(), 'track-total', 'print(12 + 8 + 10)\n', '', 20)

    expect(hasSessionProgress(store)).toBe(true)
    expect(homeCtaLabel(TASKS, store)).toBe('Продолжить: Сумма трёх чисел')
    expect(getContinueTaskId(TASKS, store)).toBe('track-total')
  })

  it('does not treat lastOpenedTaskId without a user draft as progress', () => {
    let store = saveDraftCode(emptyStore(), 'rep-sum', 'print(1 + 2 + 3 + 4)\n', '', 30)
    store = {
      ...store,
      lastOpenedTaskId: 'gate-check',
      drafts: {
        ...store.drafts,
        'gate-check': {
          code: '',
          updatedAt: null,
          lastOpenedAt: 40,
          isUserDraft: false,
        },
      },
    }

    expect(homeCtaLabel(TASKS, store)).toBe('Продолжить: Сумма чисел в цикле')
    expect(getContinueTaskId(TASKS, store)).toBe('rep-sum')
  })
})
