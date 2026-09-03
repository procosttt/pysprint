import { useState } from 'react'
import { HomeScreen } from './components/HomeScreen.tsx'
import { TaskScreen } from './components/TaskScreen.tsx'
import { getTaskById, TASKS } from './data/tasks.ts'
import { getBrowserStorage, loadStore } from './storage/drafts.ts'
import type { DraftStoreV1 } from './storage/drafts.ts'

type View = { name: 'home' } | { name: 'task'; taskId: string }

export default function App() {
  const [view, setView] = useState<View>({ name: 'home' })
  const [store, setStore] = useState<DraftStoreV1>(() => loadStore(getBrowserStorage()))

  function openTask(taskId: string) {
    const task = getTaskById(taskId)
    if (!task) {
      setView({ name: 'home' })
      return
    }
    setView({ name: 'task', taskId })
  }

  function backHome() {
    setStore(loadStore(getBrowserStorage()))
    setView({ name: 'home' })
  }

  if (view.name === 'task') {
    const task = getTaskById(view.taskId)
    if (!task) {
      return <HomeScreen store={store} onOpenTask={openTask} />
    }

    return (
      <TaskScreen
        key={task.id}
        task={task}
        taskNumber={TASKS.findIndex((item) => item.id === task.id) + 1}
        taskCount={TASKS.length}
        onBack={backHome}
      />
    )
  }

  return <HomeScreen store={store} onOpenTask={openTask} />
}
