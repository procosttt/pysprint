export const TASK_DIFFICULTIES = ['easy', 'medium', 'hard'] as const

export type TaskDifficulty = (typeof TASK_DIFFICULTIES)[number]

export type PrototypeNumber = 2 | 5 | 8

export type TruthCell = 0 | 1 | null

export type TruthTableFragment = {
  rows: readonly (readonly TruthCell[])[]
}

export type Task = {
  id: string
  title: string
  statement: string
  difficulty: TaskDifficulty
  tags: string[]
  starterCode: string
  prototypeNumber?: PrototypeNumber
  truthTable?: TruthTableFragment
}

export const DIFFICULTY_LABEL: Record<TaskDifficulty, string> = {
  easy: 'Лёгкая',
  medium: 'Средняя',
  hard: 'Сложная',
}

export function prototypeCardLabel(prototypeNumber: PrototypeNumber): string {
  return `ЕГЭ · прототип ${prototypeNumber}`
}

export function prototypeScreenLabel(prototypeNumber: PrototypeNumber): string {
  return `Авторский прототип задания №${prototypeNumber} ЕГЭ по информатике`
}
