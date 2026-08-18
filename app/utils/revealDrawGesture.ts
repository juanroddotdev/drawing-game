export function clamp01(t: number) {
  return Math.min(1, Math.max(0, t))
}

/**
 * How far an incoming card has traveled on stage.
 * Next: drag left (negative dx). Back: drag right.
 */
export function travelToDrawT(
  dragX: number,
  width: number,
  toward: 'next' | 'back' | null,
) {
  const w = Math.max(width, 1)
  if (toward === 'next') return clamp01(-dragX / w)
  if (toward === 'back') return clamp01(dragX / w)
  return 0
}

/** CSS cubic-bezier(0.22, 1, 0.36, 1) — same as `.story-slide--snap`. */
export function snapEase(t: number) {
  return bezierY(clamp01(t), 0.22, 1, 0.36, 1)
}

function bezierY(x: number, x1: number, y1: number, x2: number, y2: number) {
  let s = x
  for (let i = 0; i < 8; i++) {
    const xs = cubic(s, x1, x2) - x
    const dx = cubicDerivative(s, x1, x2)
    if (Math.abs(dx) < 1e-6) break
    s = clamp01(s - xs / dx)
  }
  return cubic(s, y1, y2)
}

function cubic(s: number, a: number, b: number) {
  const is = 1 - s
  return 3 * is * is * s * a + 3 * is * s * s * b + s * s * s
}

function cubicDerivative(s: number, a: number, b: number) {
  const is = 1 - s
  return 3 * is * is * a + 6 * is * s * (b - a) + 3 * s * s * (1 - b)
}
