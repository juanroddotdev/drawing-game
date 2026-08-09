import { describe, expect, it } from 'vitest'
import type { DrawingDocument } from '~/types/stroke'
import { createEmptyDocument, documentToJson, parseDrawingDocument, undoStroke } from '~/utils/canvas/strokes'
import { documentDurationMs, filterStrokesUntil } from '~/utils/canvas/render'
import { smoothPoint } from '~/utils/canvas/smooth'
import { generatePrompt } from '~/utils/prompts/generatePrompt'
import { indefiniteArticle, withIndefiniteArticle } from '~/utils/prompts/indefiniteArticle'
import { PROMPT_NOUNS } from '~/utils/prompts/wordBanks'
import { isExpiredTokenError, sharePath, stepTypeForNumber } from '~/types/chain'

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

  it('detects expired token errors', () => {
    expect(isExpiredTokenError('invalid_or_expired_token')).toBe(true)
    expect(isExpiredTokenError('chain_not_found')).toBe(false)
  })
})
