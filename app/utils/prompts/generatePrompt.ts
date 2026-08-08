import { PROMPT_ACTIONS, PROMPT_NOUNS } from '~/utils/prompts/wordBanks'

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!
}

/** Drawable combo prompt, e.g. "a penguin late for work". */
export function generatePrompt(): string {
  return `a ${pick(PROMPT_NOUNS)} ${pick(PROMPT_ACTIONS)}`
}
