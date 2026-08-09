import { indefiniteArticle } from '~/utils/prompts/indefiniteArticle'
import { PROMPT_ACTIONS, PROMPT_NOUNS } from '~/utils/prompts/wordBanks'

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!
}

/** Drawable combo prompt, e.g. "an octopus late for work". */
export function generatePrompt(): string {
  const noun = pick(PROMPT_NOUNS)
  const action = pick(PROMPT_ACTIONS)
  return `${indefiniteArticle(noun)} ${noun} ${action}`
}
