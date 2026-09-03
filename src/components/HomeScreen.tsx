import { DIFFICULTY_LABEL } from '../types/task.ts'
import type { DraftStoreV1 } from '../storage/drafts.ts'
import type { Task } from '../types/task.ts'
import { TASKS } from '../data/tasks.ts'
import { getContinueTaskId, hasSessionProgress } from '../state/navigation.ts'

type HomeScreenProps = {
  store: DraftStoreV1
  onOpenTask: (taskId: string) => void
}

export function HomeScreen({ store, onOpenTask }: HomeScreenProps) {
  const continueId = getContinueTaskId(TASKS, store)
  const ctaLabel = hasSessionProgress(store) ? 'Продолжить' : 'Начать'

  return (
    <div className="home">
      <header className="home-header">
        <p className="home-kicker">Тренажёр · Python</p>
        <h1 className="home-title">PySprint</h1>
        <p className="home-lead">
          Короткие задачи по Python для телефона. Откройте сет, пишите код — черновик
          сохранится сам.
        </p>
        <button
          type="button"
          className="cta"
          onClick={() => onOpenTask(continueId)}
        >
          {ctaLabel}
        </button>
      </header>

      <section className="task-list" aria-label="Список задач">
        <h2 className="task-list-title">Сеты</h2>
        <ol className="task-list-items">
          {TASKS.map((task, index) => (
            <li key={task.id}>
              <TaskRow
                task={task}
                index={index}
                hasDraft={Boolean(store.drafts[task.id]?.isUserDraft)}
                onOpen={() => onOpenTask(task.id)}
              />
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}

function TaskRow({
  task,
  index,
  hasDraft,
  onOpen,
}: {
  task: Task
  index: number
  hasDraft: boolean
  onOpen: () => void
}) {
  const number = String(index + 1).padStart(2, '0')
  const status = hasDraft ? 'Черновик' : 'Не начата'

  return (
    <button type="button" className="task-row" onClick={onOpen}>
      <span className="task-row-index">{number}</span>
      <span className="task-row-body">
        <span className="task-row-title">{task.title}</span>
        <span className="task-row-meta">
          <span className={`difficulty difficulty-${task.difficulty}`}>
            {DIFFICULTY_LABEL[task.difficulty]}
          </span>
          <span className="task-row-status">{status}</span>
        </span>
      </span>
      {hasDraft ? (
        <span className="draft-mark" aria-hidden="true" />
      ) : (
        <span className="draft-mark draft-mark-empty" aria-hidden="true" />
      )}
    </button>
  )
}
