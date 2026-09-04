import { describe, expect, it } from 'vitest'
import {
  LimitedOutputBuffer,
  OUTPUT_LIMIT,
  OUTPUT_LIMIT_MESSAGE,
  OUTPUT_LIMIT_TOKEN,
} from './outputLimit.ts'
import { CODE_MAX_LENGTH, RUN_TIMEOUT_MS } from './protocol.ts'

describe('output and run limits', () => {
  it('keeps the run timeout at 3 seconds and the code cap at 50 000', () => {
    expect(RUN_TIMEOUT_MS).toBe(3000)
    expect(CODE_MAX_LENGTH).toBe(50_000)
    expect(OUTPUT_LIMIT).toBe(50_000)
    expect(OUTPUT_LIMIT_MESSAGE).toBe('Слишком много вывода. Выполнение остановлено.')
  })

  it('stops growing the buffer once the output limit is reached', () => {
    const buffer = new LimitedOutputBuffer()
    expect(() => buffer.write('a'.repeat(OUTPUT_LIMIT + 80))).toThrowError(OUTPUT_LIMIT_TOKEN)
    expect(buffer.overflowed).toBe(true)
    expect(buffer.getvalue().length).toBe(OUTPUT_LIMIT)
    expect(buffer.write('more')).toBe(4)
    expect(buffer.getvalue().length).toBe(OUTPUT_LIMIT)
  })

  it('accepts a later write on a fresh buffer after a previous overflow', () => {
    const first = new LimitedOutputBuffer()
    try {
      first.write('x'.repeat(OUTPUT_LIMIT + 1))
    } catch {
      // Limit reached.
    }
    expect(first.overflowed).toBe(true)

    const second = new LimitedOutputBuffer()
    second.write('4\n')
    expect(second.overflowed).toBe(false)
    expect(second.getvalue()).toBe('4\n')
  })
})
