export const TAP_SLOP_PX = 12

export function isTapPointer(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  slop = TAP_SLOP_PX,
): boolean {
  const dx = endX - startX
  const dy = endY - startY
  return dx * dx + dy * dy <= slop * slop
}
