import type { DrawingDocument } from '~/types/stroke'
import type {
  ChainHubStatus,
  ChainInspectorPayload,
  CreateChainResult,
  PlayPayload,
  RevealPayload,
  SubmitStepResult,
} from '~/types/chain'
import { DEFAULT_MAX_STEPS } from '~/types/chain'

function rpcError(error: { message?: string } | null): never {
  throw new Error(error?.message || 'supabase_rpc_failed')
}

export function useChainApi() {
  const supabase = useSupabase()

  async function createChain(input: {
    promptText: string
    nickname: string
    strokeJson: DrawingDocument
    maxSteps?: number
    email?: string
  }): Promise<CreateChainResult> {
    const { data, error } = await supabase.rpc('create_chain', {
      p_prompt_text: input.promptText,
      p_nickname: input.nickname,
      p_stroke_json: input.strokeJson,
      p_max_steps: input.maxSteps ?? DEFAULT_MAX_STEPS,
      p_email: input.email || null,
    })
    if (error) rpcError(error)
    return data as CreateChainResult
  }

  async function getPlayPayload(slug: string, claimToken: string): Promise<PlayPayload> {
    const { data, error } = await supabase.rpc('get_play_payload', {
      p_slug: slug,
      p_claim_token: claimToken,
    })
    if (error) rpcError(error)
    return data as PlayPayload
  }

  async function submitStep(input: {
    slug: string
    claimToken: string
    nickname: string
    guessText?: string
    strokeJson?: DrawingDocument
    email?: string
  }): Promise<SubmitStepResult> {
    const { data, error } = await supabase.rpc('submit_step', {
      p_slug: input.slug,
      p_claim_token: input.claimToken,
      p_nickname: input.nickname,
      p_guess_text: input.guessText ?? null,
      p_stroke_json: input.strokeJson ?? null,
      p_email: input.email || null,
    })
    if (error) rpcError(error)
    return data as SubmitStepResult
  }

  async function reopenSeat(slug: string, requesterNickname: string) {
    const { data, error } = await supabase.rpc('reopen_seat', {
      p_slug: slug,
      p_requester_nickname: requesterNickname,
    })
    if (error) rpcError(error)
    return data as { slug: string, status: string, next_step: number, claim_token: string }
  }

  async function getChainStatus(slug: string): Promise<ChainHubStatus> {
    const { data, error } = await supabase.rpc('get_chain_status', {
      p_slug: slug,
    })
    if (error) rpcError(error)
    return data as ChainHubStatus
  }

  async function getReveal(slug: string): Promise<RevealPayload> {
    const { data, error } = await supabase.rpc('get_reveal', {
      p_slug: slug,
    })
    if (error) rpcError(error)
    return data as RevealPayload
  }

  function devInspectorKey(): string {
    const config = useRuntimeConfig()
    return String(config.public.devInspectorKey || '')
  }

  async function getChainInspector(slug: string): Promise<ChainInspectorPayload> {
    const { data, error } = await supabase.rpc('get_chain_inspector', {
      p_slug: slug,
      p_key: devInspectorKey(),
    })
    if (error) rpcError(error)
    return data as ChainInspectorPayload
  }

  async function devMintPlayLink(slug: string) {
    const { data, error } = await supabase.rpc('dev_mint_play_link', {
      p_slug: slug,
      p_key: devInspectorKey(),
    })
    if (error) rpcError(error)
    return data as { slug: string, next_step: number, step_type: string, claim_token: string }
  }

  return {
    createChain,
    getPlayPayload,
    submitStep,
    reopenSeat,
    getChainStatus,
    getReveal,
    getChainInspector,
    devMintPlayLink,
  }
}
