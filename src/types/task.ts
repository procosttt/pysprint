export const TASK_DIFFICULTIES = ['easy', 'medium', 'hard'] as const

export type TaskDifficulty = (typeof TASK_DIFFICULTIES)[number]

export type TaskExample = {
  input: string
  output: string
}

export type Task = {
  id: string
  title: string
  statement: string
  difficulty: TaskDifficulty
  tags: string[]
  starterCode: string
  examples: TaskExample[]
}

export const DIFFICULTY_LABEL: Record<TaskDifficulty, string> = {
  easy: 'Лёгкая',
  medium: 'Средняя',
  hard: 'Сложная',
}
