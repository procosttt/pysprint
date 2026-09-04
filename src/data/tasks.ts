import type { Task } from '../types/task.ts'

export const TASKS: readonly Task[] = [
  {
    id: 'track-total',
    title: 'Три подхода',
    statement:
      'Тренер записал число повторений в трёх подходах: 12, 8 и 10. С помощью Python вычислите общее число повторений и выведите его.',
    difficulty: 'easy',
    tags: ['arithmetic'],
    starterCode: '',
  },
  {
    id: 'gate-check',
    title: 'Допуск на сет',
    statement:
      'Результат разминки равен 8, результат контрольного подхода равен 9. Если оба значения не меньше 8, выведите ALLOW. Иначе выведите DENY.',
    difficulty: 'easy',
    tags: ['conditions'],
    starterCode: '',
  },
  {
    id: 'rep-sum',
    title: 'Сумма серии',
    statement:
      'Даны числа 1, 2, 3 и 4. С помощью Python вычислите их сумму и выведите результат.',
    difficulty: 'medium',
    tags: ['loop'],
    starterCode: '',
  },
]

export function getTaskById(taskId: string): Task | undefined {
  return TASKS.find((task) => task.id === taskId)
}

export function getTaskNumber(taskId: string): number {
  const index = TASKS.findIndex((task) => task.id === taskId)
  return index === -1 ? 0 : index + 1
}
