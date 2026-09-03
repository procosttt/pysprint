import { describe, expect, it } from 'vitest'
import { TASKS } from '../data/tasks.ts'
import { createFreeRunRequest } from './freeRun.ts'

describe('createFreeRunRequest', () => {
  it('does not use task.examples[0].input when console stdin is empty', () => {
    for (const task of TASKS) {
      const request = createFreeRunRequest(task.starterCode, '')
      expect(request.stdin).toBe('')
      expect(request.code).toBe(task.starterCode)
      for (const example of task.examples) {
        expect(example.input.length).toBeGreaterThan(0)
        expect(request.stdin).not.toBe(example.input)
      }
    }
  })

  it('passes the exact user stdin to the runner payload', () => {
    const stdin = 'Миша'
    const request = createFreeRunRequest('name = input()\nprint("Привет,", name)', stdin)
    expect(request.stdin).toBe('Миша')
    expect(request.stdin).not.toBe(TASKS[0]?.examples[0]?.input)
  })

  it('keeps empty stdin empty for a print-only program', () => {
    const request = createFreeRunRequest('print(2 + 2)', '')
    expect(request.code).toBe('print(2 + 2)')
    expect(request.stdin).toBe('')
  })

  it('forwards multiline stdin without changing it', () => {
    const stdin = '5\n7'
    const request = createFreeRunRequest(
      'a = int(input())\nb = int(input())\nprint(a + b)',
      stdin,
    )
    expect(request.stdin).toBe('5\n7')
    expect(request.stdin).toBe(stdin)
  })

  it('does not copy an example even if the editor still has starter code', () => {
    const task = TASKS[0]!
    const request = createFreeRunRequest(task.starterCode, '')
    expect(request.stdin).toBe('')
    expect(request.stdin).not.toBe(task.examples[0]!.input)
  })
})
