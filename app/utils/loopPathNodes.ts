import type { StepType } from '~/types/chain'
import { stepTypeForNumber } from '~/types/chain'

export type LoopPathMode = 'play' | 'pass' | 'reveal'

export type LoopPathNode = {
  n: number
  type: StepType
  done: boolean
  latest: boolean
  next: boolean
}

export type LoopPathConnector = 'solid' | 'arrow' | 'hairline' | 'none'

export function buildLoopPathNodes(opts: {
  maxSteps: number
  mode: LoopPathMode
  currentStep?: number
  completedStep?: number
  pathProgress?: number
  complete?: boolean
}): LoopPathNode[] {
  const { maxSteps, mode } = opts

  if (mode === 'play') {
    const current = Math.min(Math.max(opts.currentStep ?? 1, 1), maxSteps)
    return Array.from({ length: maxSteps }, (_, i) => {
      const n = i + 1
      return {
        n,
        type: stepTypeForNumber(n),
        done: n < current,
        latest: n === current,
        next: false,
      }
    })
  }

  if (mode === 'pass') {
    const completed = Math.min(Math.max(opts.completedStep ?? 0, 0), maxSteps)
    return Array.from({ length: maxSteps }, (_, i) => {
      const n = i + 1
      return {
        n,
        type: stepTypeForNumber(n),
        done: n <= completed,
        latest: completed > 0 && n === completed,
        next: n === completed + 1,
      }
    })
  }

  const progress = Math.min(Math.max(opts.pathProgress ?? 0, 0), maxSteps)
  const complete = opts.complete ?? false
  return Array.from({ length: maxSteps }, (_, i) => {
    const n = i + 1
    return {
      n,
      type: stepTypeForNumber(n),
      done: complete || n < progress,
      latest: !complete && progress > 0 && n === progress,
      next: !complete && (
        (progress === 0 && n === 1) || (progress > 0 && n === progress + 1)
      ),
    }
  })
}

export function connectorAfter(
  node: LoopPathNode,
  mode: LoopPathMode,
  index: number,
  nodes: LoopPathNode[],
): LoopPathConnector {
  if (index >= nodes.length - 1) return 'none'

  switch (mode) {
    case 'pass':
      if (node.done && !node.latest) return 'solid'
      if (node.latest) return 'arrow'
      return 'none'
    case 'play':
      if (node.done) return 'solid'
      return 'hairline'
    case 'reveal':
      if (node.done) return 'solid'
      if (node.latest) return 'arrow'
      return 'hairline'
  }
}

export function loopPathAriaLabel(opts: {
  mode: LoopPathMode
  maxSteps: number
  currentStep?: number
  completedStep?: number
  pathProgress?: number
  complete?: boolean
}): string {
  const { mode, maxSteps } = opts

  if (mode === 'play') {
    const n = opts.currentStep ?? 1
    return `Step ${n} of ${maxSteps}. ${stepTypeForNumber(n)} turn.`
  }

  if (mode === 'pass') {
    const done = opts.completedStep ?? 0
    if (done <= 0) return `Loop with ${maxSteps} steps.`
    return `Step ${done} of ${maxSteps} complete. Next is step ${done + 1}.`
  }

  const progress = opts.pathProgress ?? 0
  if (opts.complete) return `Full loop — ${maxSteps} steps complete.`
  if (progress === 0) return `Reveal starting. ${maxSteps} steps.`
  return `Through step ${progress} of ${maxSteps}.`
}
