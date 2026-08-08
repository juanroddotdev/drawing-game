import type { DrawingDocument, Stroke, StrokePoint } from '~/types/stroke'

const BG = '#f8fafc'

/** Fill background and paint all strokes onto a canvas. */
export function renderDocument(
  ctx: CanvasRenderingContext2D,
  doc: DrawingDocument,
  cssWidth: number,
  cssHeight: number,
  dpr: number,
) {
  const w = cssWidth * dpr
  const h = cssHeight * dpr
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = BG
  ctx.fillRect(0, 0, w, h)

  for (const stroke of doc.strokes) {
    paintStroke(ctx, stroke, cssWidth, cssHeight, dpr)
  }
}

export function paintStroke(
  ctx: CanvasRenderingContext2D,
  stroke: Stroke,
  cssWidth: number,
  cssHeight: number,
  dpr: number,
) {
  if (stroke.points.length === 0) return

  const lineWidth = Math.max(1, stroke.width * cssWidth * dpr)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.lineWidth = lineWidth

  if (stroke.erase) {
    ctx.globalCompositeOperation = 'destination-out'
    ctx.strokeStyle = 'rgba(0,0,0,1)'
  }
  else {
    ctx.globalCompositeOperation = 'source-over'
    ctx.strokeStyle = stroke.color
  }

  const pts = stroke.points.map((p) => toPixel(p, cssWidth, cssHeight, dpr))

  ctx.beginPath()
  if (pts.length === 1) {
    const [p] = pts
    ctx.arc(p.x, p.y, lineWidth / 2, 0, Math.PI * 2)
    ctx.fillStyle = stroke.erase ? 'rgba(0,0,0,1)' : stroke.color
    if (stroke.erase) ctx.globalCompositeOperation = 'destination-out'
    ctx.fill()
  }
  else {
    ctx.moveTo(pts[0].x, pts[0].y)
    for (let i = 1; i < pts.length - 1; i++) {
      const midX = (pts[i].x + pts[i + 1].x) / 2
      const midY = (pts[i].y + pts[i + 1].y) / 2
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY)
    }
    const last = pts[pts.length - 1]
    const prev = pts[pts.length - 2]
    ctx.quadraticCurveTo(prev.x, prev.y, last.x, last.y)
    ctx.stroke()
  }

  ctx.globalCompositeOperation = 'source-over'
}

function toPixel(
  p: StrokePoint,
  cssWidth: number,
  cssHeight: number,
  dpr: number,
): { x: number, y: number } {
  return {
    x: p.x * cssWidth * dpr,
    y: p.y * cssHeight * dpr,
  }
}

/** Replay strokes up to `untilMs` (inclusive) for time-lapse (Phase 4 helper). */
export function filterStrokesUntil(doc: DrawingDocument, untilMs: number): DrawingDocument {
  return {
    ...doc,
    strokes: doc.strokes
      .map((stroke) => ({
        ...stroke,
        points: stroke.points.filter((p) => p.t <= untilMs),
      }))
      .filter((s) => s.points.length > 0),
  }
}

/** Max point timestamp in the document (ms from drawing start). */
export function documentDurationMs(doc: DrawingDocument): number {
  let max = 0
  for (const stroke of doc.strokes) {
    for (const p of stroke.points) {
      if (p.t > max) max = p.t
    }
  }
  return max
}
