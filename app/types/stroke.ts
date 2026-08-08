/** Normalized point in canvas space (0–1). `t` is ms since drawing start. */
export type StrokePoint = {
  x: number
  y: number
  t: number
}

export type Stroke = {
  color: string
  /** Stroke width as a fraction of canvas width (e.g. 0.012). */
  width: number
  points: StrokePoint[]
  erase?: boolean
}

export type DrawingDocument = {
  version: 1
  /** width / height; V1 uses square (1). */
  aspect: number
  strokes: Stroke[]
}

export const DRAWING_DOC_VERSION = 1 as const

export const BRUSH_COLORS = [
  '#111827',
  '#dc2626',
  '#2563eb',
  '#16a34a',
  '#ca8a04',
  '#db2777',
  '#7c3aed',
  '#ffffff',
] as const

/** Continuous brush size range as fractions of canvas width. */
export const BRUSH_WIDTH_MIN = 0.008
export const BRUSH_WIDTH_MAX = 0.045
/** Thicker default for legible telephone drawings. */
export const BRUSH_WIDTH_DEFAULT = 0.02

/** @deprecated Prefer continuous slider; kept for tests/compat. */
export const BRUSH_WIDTHS = [0.008, 0.014, 0.024, 0.04] as const

export type BrushTool = 'pen' | 'eraser'
