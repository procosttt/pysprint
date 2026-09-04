import { describe, expect, it } from 'vitest'
import {
  emptyStore,
  LEGACY_STORAGE_KEY,
  loadStore,
  markTaskOpened,
  persistStore,
  saveDraftCode,
  STORAGE_KEY,
} from './drafts.ts'
import type { StorageLike } from './drafts.ts'

function createMemoryStorage(initial?: Record<string, string>): StorageLike {
  const map = new Map<string, string>(Object.entries(initial ?? {}))
  return {
    getItem(key) {
      return map.get(key) ?? null
    },
    setItem(key, value) {
      map.set(key, value)
    },
  }
}

describe('draft storage', () => {
  it('saves and restores a task draft', () => {
    const storage = createMemoryStorage()
    const starter = 'print()\n'
    let store = emptyStore()
    store = markTaskOpened(store, 'track-total', starter, 100)
    store = saveDraftCode(store, 'track-total', 'print(1)\n', starter, 200)
    persistStore(storage, store)

    const loaded = loadStore(storage)
    expect(loaded.drafts['track-total']).toEqual({
      code: 'print(1)\n',
      updatedAt: 200,
      lastOpenedAt: 100,
      isUserDraft: true,
    })
  })

  it('keeps drafts for different tasks separate', () => {
    const storage = createMemoryStorage()
    const starterA = 'a = 1\n'
    const starterB = 'b = 1\n'
    let store = emptyStore()
    store = saveDraftCode(store, 'track-total', 'a = 2\n', starterA, 10)
    store = saveDraftCode(store, 'gate-check', 'b = 9\n', starterB, 11)
    persistStore(storage, store)

    const loaded = loadStore(storage)
    expect(loaded.drafts['track-total']?.code).toBe('a = 2\n')
    expect(loaded.drafts['gate-check']?.code).toBe('b = 9\n')
    expect(loaded.drafts['track-total']?.code).not.toBe(loaded.drafts['gate-check']?.code)
  })

  it('does not let lastOpenedAt replace updatedAt', () => {
    const starter = 'n = 0\n'
    let store = saveDraftCode(emptyStore(), 'rep-sum', 'n = 3\n', starter, 1000)
    expect(store.drafts['rep-sum']?.updatedAt).toBe(1000)

    store = markTaskOpened(store, 'rep-sum', starter, 2500)
    expect(store.drafts['rep-sum']?.updatedAt).toBe(1000)
    expect(store.drafts['rep-sum']?.lastOpenedAt).toBe(2500)
    expect(store.drafts['rep-sum']?.code).toBe('n = 3\n')
  })

  it('does not load drafts from the legacy storage key', () => {
    const storage = createMemoryStorage({
      [LEGACY_STORAGE_KEY]: JSON.stringify({
        version: 1,
        lastOpenedTaskId: 'track-total',
        drafts: {
          'track-total': {
            code: 'a = int(input())\nb = int(input())\nc = int(input())\n',
            updatedAt: 1,
            lastOpenedAt: 1,
            isUserDraft: true,
          },
        },
      }),
    })

    expect(loadStore(storage)).toEqual(emptyStore())
    expect(storage.getItem(LEGACY_STORAGE_KEY)).toContain('int(input())')
  })

  it('saves new code to the current storage key and restores it', () => {
    const storage = createMemoryStorage({
      [LEGACY_STORAGE_KEY]: JSON.stringify({
        version: 1,
        lastOpenedTaskId: 'track-total',
        drafts: {
          'track-total': {
            code: 'a = int(input())\n',
            updatedAt: 1,
            lastOpenedAt: 1,
            isUserDraft: true,
          },
        },
      }),
    })

    let store = saveDraftCode(emptyStore(), 'track-total', 'print(2 + 2)\n', '', 50)
    persistStore(storage, store)

    const loaded = loadStore(storage)
    expect(loaded.drafts['track-total']?.code).toBe('print(2 + 2)\n')
    expect(loaded.drafts['track-total']?.isUserDraft).toBe(true)
    expect(storage.getItem(STORAGE_KEY)).toContain('print(2 + 2)')
    expect(storage.getItem(LEGACY_STORAGE_KEY)).toContain('int(input())')
  })

  it('does not turn a task into a user draft when it is only opened', () => {
    const storage = createMemoryStorage()
    let store = markTaskOpened(emptyStore(), 'track-total', '', 100)
    persistStore(storage, store)

    const loaded = loadStore(storage)
    expect(loaded.lastOpenedTaskId).toBe('track-total')
    expect(loaded.drafts['track-total']?.code).toBe('')
    expect(loaded.drafts['track-total']?.isUserDraft).toBe(false)
  })

  it('recovers from corrupted or stale localStorage entries', () => {
    const brokenJson = createMemoryStorage({ [STORAGE_KEY]: '{not-json' })
    expect(loadStore(brokenJson)).toEqual(emptyStore())

    const staleVersion = createMemoryStorage({
      [STORAGE_KEY]: JSON.stringify({
        version: 99,
        lastOpenedTaskId: 'track-total',
        drafts: {
          'track-total': { code: 'lost', updatedAt: 1, lastOpenedAt: 1, isUserDraft: true },
        },
      }),
    })
    expect(loadStore(staleVersion)).toEqual(emptyStore())

    const mixed = createMemoryStorage({
      [STORAGE_KEY]: JSON.stringify({
        version: 1,
        lastOpenedTaskId: 'track-total',
        drafts: {
          'track-total': {
            code: 'ok',
            updatedAt: 8,
            lastOpenedAt: 9,
            isUserDraft: true,
          },
          broken: { code: 12 },
          alsoBroken: null,
        },
      }),
    })
    const loaded = loadStore(mixed)
    expect(loaded.lastOpenedTaskId).toBe('track-total')
    expect(loaded.drafts['track-total']?.code).toBe('ok')
    expect(loaded.drafts.broken).toBeUndefined()
    expect(loaded.drafts.alsoBroken).toBeUndefined()

    const throwing: StorageLike = {
      getItem() {
        throw new Error('blocked')
      },
      setItem() {
        throw new Error('blocked')
      },
    }
    expect(loadStore(throwing)).toEqual(emptyStore())
  })
})
