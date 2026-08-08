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
  '#ffffff',
] as const

/** Brush sizes as fractions of canvas width. */
export const BRUSH_WIDTHS = [0.008, 0.014, 0.024, 0.04] as const

export type BrushTool = 'pen' | 'eraser'
