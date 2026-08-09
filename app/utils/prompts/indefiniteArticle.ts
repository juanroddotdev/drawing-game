/** English indefinite article for the start of `word` (letter heuristic). */
export function indefiniteArticle(word: string): 'a' | 'an' {
  const first = word.trim().charAt(0).toLowerCase()
  if (!first) return 'a'
  return 'aeiou'.includes(first) ? 'an' : 'a'
}

/** Prepend "a" / "an" to a bare noun or phrase, e.g. "octopus" → "an octopus". */
export function withIndefiniteArticle(phrase: string): string {
  const trimmed = phrase.trim()
  if (!trimmed) return trimmed
  return `${indefiniteArticle(trimmed)} ${trimmed}`
}
