import { describe, expect, it } from 'vitest'
import { isTapPointer, TAP_SLOP_PX } from './pointer.ts'

describe('pointer tap vs swipe', () => {
  it('treats a small movement as a tap', () => {
    expect(isTapPointer(10, 10, 10, 10)).toBe(true)
    expect(isTapPointer(0, 0, TAP_SLOP_PX, 0)).toBe(true)
  })

  it('treats a horizontal swipe as not a tap', () => {
    expect(isTapPointer(0, 0, TAP_SLOP_PX + 1, 0)).toBe(false)
    expect(isTapPointer(40, 8, 90, 10)).toBe(false)
  })
})
