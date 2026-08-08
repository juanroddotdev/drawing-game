import type { DrawingDocument } from '~/types/stroke'

export type ChainStatus =
  | 'active'
  | 'awaiting_pass'
  | 'open_seat'
  | 'complete'
  | 'abandoned'

export type StepType = 'draw' | 'guess'

export type CreateChainResult = {
  slug: string
  chain_id: string
  max_steps: number
  next_step: number
  claim_token: string
  status: ChainStatus
}

export type PlayPayload = {
  status: ChainStatus
  slug: string
  max_steps: number
  step_number?: number
  step_type?: StepType
  due_at?: string | null
  prior_guess_text?: string | null
  prior_stroke_json?: DrawingDocument | null
}

export type SubmitStepResult = {
  slug: string
  status: ChainStatus
  completed_step: number
  next_step: number | null
  claim_token: string | null
}

export type RevealStep = {
  step_number: number
  type: StepType
  author_nickname: string | null
  guess_text: string | null
  stroke_json: DrawingDocument | null
  submitted_at: string | null
}

export type RevealPayload = {
  slug: string
  prompt_text: string
  max_steps: number
  status: ChainStatus
  creator_nickname: string
  steps: RevealStep[]
}

export type ChainHubStatus = {
  slug: string
  status: ChainStatus
  max_steps: number
  current_step: number
  last_completer_nickname: string | null
  step_status: string
  step_type: StepType
  due_at: string | null
}

export const DEFAULT_MAX_STEPS = 6
export const DEFAULT_TIMEOUT_HOURS = 24

export function stepTypeForNumber(stepNumber: number): StepType {
  return stepNumber % 2 === 1 ? 'draw' : 'guess'
}

export function sharePath(slug: string, token: string): string {
  return `/c/${slug}/play?token=${encodeURIComponent(token)}`
}

export function isExpiredTokenError(message: string): boolean {
  return /invalid_or_expired_token/i.test(message)
}
