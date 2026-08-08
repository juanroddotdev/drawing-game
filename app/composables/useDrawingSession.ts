import type { BrushTool, DrawingDocument } from '~/types/stroke'
import { BRUSH_COLORS, BRUSH_WIDTHS } from '~/types/stroke'
import { cloneDocument, createEmptyDocument, undoStroke } from '~/utils/canvas/strokes'

export function useDrawingSession(initial?: DrawingDocument) {
  const document = ref<DrawingDocument>(initial ? cloneDocument(initial) : createEmptyDocument())
  const color = ref<string>(BRUSH_COLORS[0])
  const width = ref<number>(BRUSH_WIDTHS[1])
  const tool = ref<BrushTool>('pen')
  const startedAt = ref<number | null>(null)

  const canUndo = computed(() => document.value.strokes.length > 0)
  const strokeCount = computed(() => document.value.strokes.length)

  function resetClock() {
    startedAt.value = null
  }

  function nowOffset(): number {
    if (startedAt.value === null) {
      startedAt.value = performance.now()
      return 0
    }
    return performance.now() - startedAt.value
  }

  function setDocument(doc: DrawingDocument) {
    document.value = cloneDocument(doc)
    resetClock()
  }

  function clear() {
    document.value = createEmptyDocument(document.value.aspect)
    resetClock()
  }

  function undo() {
    document.value = undoStroke(document.value)
  }

  function beginStroke(x: number, y: number) {
    const erase = tool.value === 'eraser'
    document.value = {
      ...document.value,
      strokes: [
        ...document.value.strokes,
        {
          color: erase ? '#000000' : color.value,
          width: width.value,
          erase,
          points: [{ x, y, t: nowOffset() }],
        },
      ],
    }
  }

  function appendPoint(x: number, y: number) {
    const strokes = document.value.strokes
    if (strokes.length === 0) return
    const last = strokes[strokes.length - 1]
    const points = last.points
    const prev = points[points.length - 1]
    // Skip near-duplicate samples to keep JSON lean
    const dx = x - prev.x
    const dy = y - prev.y
    if (dx * dx + dy * dy < 0.00000025) return

    const next = {
      ...last,
      points: [...points, { x, y, t: nowOffset() }],
    }
    document.value = {
      ...document.value,
      strokes: [...strokes.slice(0, -1), next],
    }
  }

  return {
    document,
    color,
    width,
    tool,
    canUndo,
    strokeCount,
    colors: BRUSH_COLORS,
    widths: BRUSH_WIDTHS,
    setDocument,
    clear,
    undo,
    beginStroke,
    appendPoint,
  }
}
