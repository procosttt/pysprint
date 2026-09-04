import { describe, expect, it } from 'vitest'
import { TASKS } from './tasks.ts'
import { CODE_MAX_LENGTH } from '../python/protocol.ts'

describe('task bank', () => {
  it('contains exactly ten tasks with unique ids and titles', () => {
    expect(TASKS).toHaveLength(10)
    expect(new Set(TASKS.map((task) => task.id)).size).toBe(10)
    expect(new Set(TASKS.map((task) => task.title)).size).toBe(10)
  })

  it('keeps the first three warmup tasks without a prototype number', () => {
    expect(TASKS.slice(0, 3).every((task) => task.prototypeNumber === undefined)).toBe(true)
  })

  it('adds two prototype 2, two prototype 5 and three prototype 8 tasks', () => {
    const counts = { 2: 0, 5: 0, 8: 0 }
    for (const task of TASKS) {
      if (task.prototypeNumber) {
        counts[task.prototypeNumber] += 1
      }
    }
    expect(counts).toEqual({ 2: 2, 5: 2, 8: 3 })
  })

  it('uses empty starter code and no input() in new tasks', () => {
    for (const task of TASKS) {
      expect(task.starterCode).toBe('')
      expect(task.statement.includes('input()')).toBe(false)
      expect(task.starterCode.includes('input()')).toBe(false)
    }
  })

  it('keeps prototype labels aligned with table fragments for type 2', () => {
    const typeTwo = TASKS.filter((task) => task.prototypeNumber === 2)
    expect(typeTwo).toHaveLength(2)
    for (const task of typeTwo) {
      expect(task.truthTable?.rows).toHaveLength(3)
      for (const row of task.truthTable?.rows ?? []) {
        expect(row).toHaveLength(5)
        expect(row[4] === 0 || row[4] === 1).toBe(true)
      }
    }
    expect(TASKS.filter((task) => task.prototypeNumber === 5).every((task) => !task.truthTable)).toBe(
      true,
    )
    expect(TASKS.filter((task) => task.prototypeNumber === 8).every((task) => !task.truthTable)).toBe(
      true,
    )
  })

  it('limits editor code to 50 000 characters', () => {
    expect(CODE_MAX_LENGTH).toBe(50_000)
  })
})
