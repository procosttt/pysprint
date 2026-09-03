export const STORAGE_KEY = 'py-sprint.drafts.v1'
export const STORE_VERSION = 1 as const

export type DraftRecord = {
  code: string
  updatedAt: number | null
  lastOpenedAt: number
  isUserDraft: boolean
}

export type DraftStoreV1 = {
  version: typeof STORE_VERSION
  lastOpenedTaskId: string | null
  drafts: Record<string, DraftRecord>
}

export type StorageLike = {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

const memory = new Map<string, string>()

export const memoryStorage: StorageLike = {
  getItem(key) {
    return memory.get(key) ?? null
  },
  setItem(key, value) {
    memory.set(key, value)
  },
}

export function emptyStore(): DraftStoreV1 {
  return {
    version: STORE_VERSION,
    lastOpenedTaskId: null,
    drafts: {},
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function sanitizeDraft(value: unknown): DraftRecord | null {
  if (!isRecord(value)) {
    return null
  }
  if (typeof value.code !== 'string') {
    return null
  }
  if (typeof value.lastOpenedAt !== 'number' || !Number.isFinite(value.lastOpenedAt)) {
    return null
  }
  if (typeof value.isUserDraft !== 'boolean') {
    return null
  }

  let updatedAt: number | null = null
  if (value.updatedAt === null) {
    updatedAt = null
  } else if (typeof value.updatedAt === 'number' && Number.isFinite(value.updatedAt)) {
    updatedAt = value.updatedAt
  } else {
    return null
  }

  return {
    code: value.code,
    updatedAt,
    lastOpenedAt: value.lastOpenedAt,
    isUserDraft: value.isUserDraft,
  }
}

export function parseStore(raw: string | null): DraftStoreV1 {
  if (!raw) {
    return emptyStore()
  }

  try {
    const data: unknown = JSON.parse(raw)
    if (!isRecord(data) || data.version !== STORE_VERSION) {
      return emptyStore()
    }

    const drafts: Record<string, DraftRecord> = {}
    if (isRecord(data.drafts)) {
      for (const [taskId, value] of Object.entries(data.drafts)) {
        const draft = sanitizeDraft(value)
        if (draft) {
          drafts[taskId] = draft
        }
      }
    }

    const lastOpenedTaskId =
      typeof data.lastOpenedTaskId === 'string' ? data.lastOpenedTaskId : null

    return {
      version: STORE_VERSION,
      lastOpenedTaskId,
      drafts,
    }
  } catch {
    return emptyStore()
  }
}

export function loadStore(storage: StorageLike): DraftStoreV1 {
  try {
    return parseStore(storage.getItem(STORAGE_KEY))
  } catch {
    return emptyStore()
  }
}

export function persistStore(storage: StorageLike, store: DraftStoreV1): void {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // Quota or private-mode failures should not break the editor.
  }
}

export function markTaskOpened(
  store: DraftStoreV1,
  taskId: string,
  starterCode: string,
  now: number,
): DraftStoreV1 {
  const existing = store.drafts[taskId]
  const draft: DraftRecord = existing
    ? { ...existing, lastOpenedAt: now }
    : {
        code: starterCode,
        updatedAt: null,
        lastOpenedAt: now,
        isUserDraft: false,
      }

  return {
    ...store,
    lastOpenedTaskId: taskId,
    drafts: {
      ...store.drafts,
      [taskId]: draft,
    },
  }
}

export function saveDraftCode(
  store: DraftStoreV1,
  taskId: string,
  code: string,
  starterCode: string,
  now: number,
): DraftStoreV1 {
  const existing = store.drafts[taskId]
  return {
    ...store,
    drafts: {
      ...store.drafts,
      [taskId]: {
        code,
        updatedAt: now,
        lastOpenedAt: existing?.lastOpenedAt ?? now,
        isUserDraft: code !== starterCode,
      },
    },
  }
}

export function getBrowserStorage(): StorageLike {
  try {
    const storage = window.localStorage
    const probe = 'py-sprint.probe'
    storage.setItem(probe, '1')
    storage.removeItem(probe)
    return storage
  } catch {
    return memoryStorage
  }
}
