import type { Task } from '../types/task.ts'

export const TASKS: readonly Task[] = [
  {
    id: 'track-total',
    title: 'Три подхода',
    statement:
      'Тренер записал число повторений в трёх подходах — по одному целому числу в строке. Выведите общее число повторений.',
    difficulty: 'easy',
    tags: ['arithmetic', 'input'],
    starterCode: 'a = int(input())\nb = int(input())\nc = int(input())\n',
    examples: [
      {
        input: '12\n8\n10',
        output: '30',
      },
    ],
  },
  {
    id: 'gate-check',
    title: 'Допуск на сет',
    statement:
      'Даны два целых числа: результат разминки и результат контрольного подхода. Если оба значения не меньше 8, выведите ALLOW. Иначе выведите DENY.',
    difficulty: 'easy',
    tags: ['conditions'],
    starterCode: 'warmup = int(input())\nset_score = int(input())\n',
    examples: [
      {
        input: '8\n9',
        output: 'ALLOW',
      },
      {
        input: '7\n10',
        output: 'DENY',
      },
    ],
  },
  {
    id: 'rep-sum',
    title: 'Сумма серии',
    statement:
      'В первой строке дано целое число n. Далее идут n целых чисел, каждое на своей строке. Выведите сумму этих n чисел.',
    difficulty: 'medium',
    tags: ['loop'],
    starterCode: 'n = int(input())\n',
    examples: [
      {
        input: '4\n1\n2\n3\n4',
        output: '10',
      },
    ],
  },
]

export function getTaskById(taskId: string): Task | undefined {
  return TASKS.find((task) => task.id === taskId)
}

export function getTaskNumber(taskId: string): number {
  const index = TASKS.findIndex((task) => task.id === taskId)
  return index === -1 ? 0 : index + 1
}
