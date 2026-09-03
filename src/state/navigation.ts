import type { DraftStoreV1 } from '../storage/drafts.ts'
import type { Task } from '../types/task.ts'

export function getContinueTaskId(
  tasks: readonly Task[],
  store: DraftStoreV1,
): string {
  const ids = new Set(tasks.map((task) => task.id))
  if (store.lastOpenedTaskId && ids.has(store.lastOpenedTaskId)) {
    return store.lastOpenedTaskId
  }

  const withDraft = tasks.find((task) => store.drafts[task.id]?.isUserDraft)
  const first = tasks[0]
  if (!first) {
    throw new Error('PySprint requires at least one task')
  }
  return withDraft?.id ?? first.id
}

export function hasSessionProgress(store: DraftStoreV1): boolean {
  if (store.lastOpenedTaskId) {
    return true
  }
  return Object.values(store.drafts).some((draft) => draft.isUserDraft)
}
