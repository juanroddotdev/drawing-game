/**
 * Exponential moving average (streamline) toward a raw pointer sample.
 * `alpha` in (0, 1]: higher follows the finger more tightly.
 */
export function smoothPoint(
  prev: { x: number, y: number },
  raw: { x: number, y: number },
  alpha: number,
): { x: number, y: number } {
  const a = Math.min(1, Math.max(0, alpha))
  return {
    x: prev.x + a * (raw.x - prev.x),
    y: prev.y + a * (raw.y - prev.y),
  }
}
