import type { DrawingDocument, Stroke, StrokePoint } from '~/types/stroke'
import { DRAWING_DOC_VERSION } from '~/types/stroke'

export function createEmptyDocument(aspect = 1): DrawingDocument {
  return {
    version: DRAWING_DOC_VERSION,
    aspect,
    strokes: [],
  }
}

export function cloneDocument(doc: DrawingDocument): DrawingDocument {
  return {
    version: doc.version,
    aspect: doc.aspect,
    strokes: doc.strokes.map((stroke) => ({
      ...stroke,
      points: stroke.points.map((p) => ({ ...p })),
    })),
  }
}

export function documentToJson(doc: DrawingDocument): string {
  return JSON.stringify(doc)
}

export function parseDrawingDocument(raw: string): DrawingDocument {
  const parsed = JSON.parse(raw) as DrawingDocument
  if (!parsed || parsed.version !== DRAWING_DOC_VERSION || !Array.isArray(parsed.strokes)) {
    throw new Error('Invalid drawing document')
  }
  return {
    version: DRAWING_DOC_VERSION,
    aspect: typeof parsed.aspect === 'number' && parsed.aspect > 0 ? parsed.aspect : 1,
    strokes: parsed.strokes.map(normalizeStroke),
  }
}

function normalizeStroke(stroke: Stroke): Stroke {
  return {
    color: stroke.color || '#111827',
    width: typeof stroke.width === 'number' ? stroke.width : 0.014,
    erase: Boolean(stroke.erase),
    points: (stroke.points || []).map((p: StrokePoint) => ({
      x: clamp01(p.x),
      y: clamp01(p.y),
      t: typeof p.t === 'number' ? p.t : 0,
    })),
  }
}

export function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n))
}

export function undoStroke(doc: DrawingDocument): DrawingDocument {
  if (doc.strokes.length === 0) return doc
  return {
    ...doc,
    strokes: doc.strokes.slice(0, -1),
  }
}
