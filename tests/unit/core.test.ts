import { describe, expect, it } from 'vitest'
import type { DrawingDocument } from '~/types/stroke'
import { createEmptyDocument, documentToJson, parseDrawingDocument, undoStroke } from '~/utils/canvas/strokes'
import { documentDurationMs, filterStrokesUntil } from '~/utils/canvas/render'
import { smoothPoint } from '~/utils/canvas/smooth'
import { generatePrompt } from '~/utils/prompts/generatePrompt'
import { indefiniteArticle, withIndefiniteArticle } from '~/utils/prompts/indefiniteArticle'
import { PROMPT_NOUNS } from '~/utils/prompts/wordBanks'
import { isExpiredTokenError, sharePath, stepTypeForNumber } from '~/types/chain'
import { displayShareUrl } from '~/utils/passHandoff'
import { formatPassSubheader, pickPassSubheader } from '~/utils/passCopy'
import { snapEase, travelToDrawT } from '~/utils/revealDrawGesture'
import { buildLoopPathNodes, connectorAfter } from '~/utils/loopPathNodes'

describe('strokes', () => {
  it('round-trips JSON', () => {
    const doc: DrawingDocument = {
      version: 1,
      aspect: 1,
      strokes: [{
        color: '#111827',
        width: 0.014,
        points: [{ x: 0.1, y: 0.2, t: 0 }, { x: 0.3, y: 0.4, t: 50 }],
      }],
    }
    const parsed = parseDrawingDocument(documentToJson(doc))
    expect(parsed.strokes).toHaveLength(1)
    expect(parsed.strokes[0]!.points[1]!.t).toBe(50)
  })

  it('undo removes last stroke', () => {
    let doc = createEmptyDocument()
    doc = {
      ...doc,
      strokes: [
        { color: '#000', width: 0.01, points: [{ x: 0, y: 0, t: 0 }] },
        { color: '#000', width: 0.01, points: [{ x: 1, y: 1, t: 1 }] },
      ],
    }
    expect(undoStroke(doc).strokes).toHaveLength(1)
  })
})

describe('smoothPoint', () => {
  it('blends toward raw by alpha', () => {
    const out = smoothPoint({ x: 0, y: 0 }, { x: 1, y: 0 }, 0.4)
    expect(out.x).toBeCloseTo(0.4)
    expect(out.y).toBeCloseTo(0)
  })

  it('alpha 1 follows raw exactly', () => {
    const out = smoothPoint({ x: 0, y: 0 }, { x: 0.5, y: 0.25 }, 1)
    expect(out).toEqual({ x: 0.5, y: 0.25 })
  })

  it('alpha 0 stays at previous', () => {
    const out = smoothPoint({ x: 0.2, y: 0.3 }, { x: 1, y: 1 }, 0)
    expect(out).toEqual({ x: 0.2, y: 0.3 })
  })
})

describe('replay helpers', () => {
  it('filters points by time', () => {
    const doc: DrawingDocument = {
      version: 1,
      aspect: 1,
      strokes: [{
        color: '#000',
        width: 0.01,
        points: [
          { x: 0, y: 0, t: 0 },
          { x: 0.5, y: 0.5, t: 100 },
          { x: 1, y: 1, t: 200 },
        ],
      }],
    }
    const partial = filterStrokesUntil(doc, 100)
    expect(partial.strokes[0]!.points).toHaveLength(2)
    expect(documentDurationMs(doc)).toBe(200)
  })
})

describe('prompts & chain helpers', () => {
  it('picks a vs an from the first letter', () => {
    expect(indefiniteArticle('penguin')).toBe('a')
    expect(indefiniteArticle('octopus')).toBe('an')
    expect(indefiniteArticle('Astronaut')).toBe('an')
    expect(withIndefiniteArticle('dentist')).toBe('a dentist')
  })

  it('uses the right article for every bank noun', () => {
    for (const noun of PROMPT_NOUNS) {
      expect(withIndefiniteArticle(noun)).toBe(`${indefiniteArticle(noun)} ${noun}`)
    }
  })

  it('generatePrompt returns drawable combo shape', () => {
    const prompt = generatePrompt()
    expect(prompt).toMatch(/^(a|an) \S+ .+/)
    expect(prompt.length).toBeGreaterThan(5)
  })

  it('step types alternate draw/guess', () => {
    expect(stepTypeForNumber(1)).toBe('draw')
    expect(stepTypeForNumber(2)).toBe('guess')
    expect(stepTypeForNumber(3)).toBe('draw')
  })

  it('sharePath encodes token', () => {
    expect(sharePath('abc', 'tok/en')).toContain('token=tok%2Fen')
  })

  it('displayShareUrl hides the claim token', () => {
    expect(displayShareUrl('https://doodleloop.app/c/2f8249fc57/play?token=secret'))
      .toBe('doodleloop.app/c/2f8249fc…')
    expect(displayShareUrl('http://localhost:3000/c/abcdefghij/play?token=x'))
      .toBe('localhost:3000/c/abcdefgh…')
  })

  it('formats pass subheaders with or without a name', () => {
    expect(formatPassSubheader('Pure art, {name}. Pass it on.', 'Juan'))
      .toBe('Pure art, Juan. Pass it on.')
    expect(formatPassSubheader('Pure art, {name}. Pass it on.', ''))
      .toBe('Pure art. Pass it on.')
    expect(pickPassSubheader('draw', 'Alex')).toContain('Alex')
  })

  it('detects expired token errors', () => {
    expect(isExpiredTokenError('invalid_or_expired_token')).toBe(true)
    expect(isExpiredTokenError('chain_not_found')).toBe(false)
  })
})

describe('reveal draw gesture', () => {
  it('maps card travel to drawing progress', () => {
    expect(travelToDrawT(-200, 400, 'next')).toBeCloseTo(0.5)
    expect(travelToDrawT(-400, 400, 'next')).toBe(1)
    expect(travelToDrawT(200, 400, 'back')).toBeCloseTo(0.5)
    expect(travelToDrawT(0, 400, 'next')).toBe(0)
    expect(travelToDrawT(-50, 400, 'back')).toBe(0)
  })

  it('eases from 0 to 1 like the card snap curve', () => {
    expect(snapEase(0)).toBeCloseTo(0)
    expect(snapEase(1)).toBeCloseTo(1)
    expect(snapEase(0.5)).toBeGreaterThan(0.5)
  })
})

describe('loop path nodes', () => {
  it('highlights the current step in play mode', () => {
    const nodes = buildLoopPathNodes({ maxSteps: 6, mode: 'play', currentStep: 3 })
    expect(nodes[2]!.latest).toBe(true)
    expect(nodes[1]!.done).toBe(true)
    expect(nodes[3]!.done).toBe(false)
    expect(connectorAfter(nodes[1]!, 'play', 1, nodes)).toBe('solid')
    expect(connectorAfter(nodes[2]!, 'play', 2, nodes)).toBe('hairline')
  })

  it('draws an arrow into the next seat on pass', () => {
    const nodes = buildLoopPathNodes({ maxSteps: 6, mode: 'pass', completedStep: 2 })
    expect(nodes[1]!.latest).toBe(true)
    expect(nodes[2]!.next).toBe(true)
    expect(connectorAfter(nodes[1]!, 'pass', 1, nodes)).toBe('arrow')
  })

  it('reveals future steps with hairlines before the story starts', () => {
    const nodes = buildLoopPathNodes({ maxSteps: 6, mode: 'reveal', pathProgress: 0 })
    expect(nodes[0]!.next).toBe(true)
    expect(connectorAfter(nodes[0]!, 'reveal', 0, nodes)).toBe('hairline')
  })
})
