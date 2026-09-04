import type { DraftStoreV1 } from '../storage/drafts.ts'
import type { Task } from '../types/task.ts'

export function getContinueTaskId(
  tasks: readonly Task[],
  store: DraftStoreV1,
): string {
  const ids = new Set(tasks.map((task) => task.id))
  const lastOpened = store.lastOpenedTaskId
  if (lastOpened && ids.has(lastOpened) && store.drafts[lastOpened]?.isUserDraft) {
    return lastOpened
  }

  const withDraft = tasks.find((task) => store.drafts[task.id]?.isUserDraft)
  const first = tasks[0]
  if (!first) {
    throw new Error('PySprint requires at least one task')
  }
  return withDraft?.id ?? first.id
}

export function hasSessionProgress(store: DraftStoreV1): boolean {
  return Object.values(store.drafts).some((draft) => draft.isUserDraft)
}

export function homeCtaLabel(tasks: readonly Task[], store: DraftStoreV1): string {
  if (!hasSessionProgress(store)) {
    return 'Начать первую задачу'
  }

  const taskId = getContinueTaskId(tasks, store)
  const task = tasks.find((item) => item.id === taskId)
  if (!task) {
    return 'Начать первую задачу'
  }
  return `Продолжить: ${task.title}`
}
