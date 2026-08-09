import type { RevealPayload } from '~/types/chain'
import type { DrawingDocument, Stroke, StrokePoint } from '~/types/stroke'
import { DRAWING_DOC_VERSION } from '~/types/stroke'

function pts(coords: Array<[number, number]>, t0 = 0): StrokePoint[] {
  return coords.map(([x, y], i) => ({ x, y, t: t0 + i * 40 }))
}

function stroke(color: string, width: number, coords: Array<[number, number]>, t0 = 0): Stroke {
  return { color, width, points: pts(coords, t0) }
}

function doc(strokes: Stroke[]): DrawingDocument {
  return { version: DRAWING_DOC_VERSION, aspect: 1, strokes }
}

/** Simple penguin-ish doodle for pass / reveal mocks. */
export const MOCK_DRAWING_PENGUIN = doc([
  stroke('#111827', 0.022, [
    [0.35, 0.72], [0.28, 0.78], [0.72, 0.78], [0.65, 0.72],
  ]),
  stroke('#111827', 0.02, [
    [0.5, 0.28], [0.38, 0.42], [0.38, 0.62], [0.5, 0.7], [0.62, 0.62], [0.62, 0.42], [0.5, 0.28],
  ], 200),
  stroke('#111827', 0.018, [
    [0.5, 0.22], [0.42, 0.32], [0.58, 0.32], [0.5, 0.22],
  ], 500),
  stroke('#111827', 0.014, [[0.45, 0.3], [0.46, 0.31]], 700),
  stroke('#111827', 0.014, [[0.54, 0.3], [0.55, 0.31]], 750),
  stroke('#ca8a04', 0.016, [[0.5, 0.34], [0.58, 0.36], [0.5, 0.38]], 800),
  stroke('#111827', 0.018, [[0.38, 0.5], [0.22, 0.42]], 900),
  stroke('#111827', 0.018, [[0.62, 0.5], [0.78, 0.45]], 950),
])

/** Loose “chef / blob” doodle — intentionally ambiguous. */
export const MOCK_DRAWING_BLOB = doc([
  stroke('#111827', 0.024, [
    [0.5, 0.25], [0.35, 0.35], [0.32, 0.55], [0.45, 0.7], [0.55, 0.7], [0.68, 0.55], [0.65, 0.35], [0.5, 0.25],
  ]),
  stroke('#111827', 0.016, [[0.4, 0.4], [0.42, 0.42]], 300),
  stroke('#111827', 0.016, [[0.58, 0.4], [0.6, 0.42]], 350),
  stroke('#111827', 0.018, [[0.42, 0.52], [0.58, 0.52]], 400),
  stroke('#2563eb', 0.02, [
    [0.62, 0.22], [0.78, 0.32], [0.62, 0.42], [0.46, 0.32], [0.62, 0.22],
  ], 500),
  stroke('#111827', 0.014, [[0.62, 0.42], [0.62, 0.58]], 700),
])

/** Stick figure on a board — third beat for the reveal. */
export const MOCK_DRAWING_SURFER = doc([
  stroke('#16a34a', 0.02, [
    [0.18, 0.72], [0.35, 0.62], [0.65, 0.62], [0.82, 0.74], [0.65, 0.78], [0.35, 0.78], [0.18, 0.72],
  ]),
  stroke('#111827', 0.02, [
    [0.5, 0.28], [0.5, 0.55],
  ], 200),
  stroke('#111827', 0.018, [
    [0.5, 0.35], [0.35, 0.48],
  ], 300),
  stroke('#111827', 0.018, [
    [0.5, 0.35], [0.68, 0.45],
  ], 350),
  stroke('#111827', 0.018, [
    [0.5, 0.55], [0.4, 0.7],
  ], 400),
  stroke('#111827', 0.018, [
    [0.5, 0.55], [0.62, 0.7],
  ], 450),
  stroke('#111827', 0.016, [
    [0.5, 0.22], [0.42, 0.3], [0.58, 0.3], [0.5, 0.22],
  ], 500),
])

export function mockPassDrawing(): DrawingDocument {
  return MOCK_DRAWING_PENGUIN
}

/** Full 6-step telephone for the reveal lab. */
export function mockRevealPayload(): RevealPayload {
  return {
    slug: 'lab-reveal',
    prompt_text: 'a penguin surfing',
    max_steps: 6,
    status: 'complete',
    creator_nickname: 'Jordan',
    steps: [
      {
        step_number: 1,
        type: 'draw',
        author_nickname: 'Jordan',
        guess_text: null,
        stroke_json: MOCK_DRAWING_PENGUIN,
        submitted_at: '2026-08-08T20:00:00Z',
      },
      {
        step_number: 2,
        type: 'guess',
        author_nickname: 'Sam',
        guess_text: 'a tuxedo bowling pin on a banana',
        stroke_json: null,
        submitted_at: '2026-08-08T20:12:00Z',
      },
      {
        step_number: 3,
        type: 'draw',
        author_nickname: 'Riley',
        guess_text: null,
        stroke_json: MOCK_DRAWING_BLOB,
        submitted_at: '2026-08-08T20:40:00Z',
      },
      {
        step_number: 4,
        type: 'guess',
        author_nickname: 'Alex',
        guess_text: 'a chef fighting a kite',
        stroke_json: null,
        submitted_at: '2026-08-08T21:05:00Z',
      },
      {
        step_number: 5,
        type: 'draw',
        author_nickname: 'Casey',
        guess_text: null,
        stroke_json: MOCK_DRAWING_SURFER,
        submitted_at: '2026-08-08T21:30:00Z',
      },
      {
        step_number: 6,
        type: 'guess',
        author_nickname: 'Morgan',
        guess_text: 'someone late for work on a leaf',
        stroke_json: null,
        submitted_at: '2026-08-08T21:55:00Z',
      },
    ],
  }
}
