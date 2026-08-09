/** Short pass-screen lines — witty, not meme-y. Pick once per visit. */

export const PASS_DRAW_LINES = [
  'Masterpiece logged, {name}. Send this so someone can guess what it is.',
  'Pure art, {name}. Pass the link and let them decipher it.',
  'Glorious mess, {name}. Time to hand off the confusion.',
  'Bold choices, {name}. Let’s see if your friends can make sense of that.',
  'You did your part, {name}. Pass it on and watch the chaos begin.',
  'We won’t judge, {name}. Your friends might — send the link.',
] as const

export const PASS_GUESS_LINES = [
  'Solid guess, {name}. Pass this so someone has to draw it.',
  'Locked in, {name}. Send the link — their turn to doodle that.',
  'Interesting call, {name}. Hand it off and see what they sketch.',
  'You named it, {name}. Now make someone draw the evidence.',
  'Nice save, {name}. Pass it on before anyone second-guesses you.',
] as const

function pickOne(lines: readonly string[]): string {
  return lines[Math.floor(Math.random() * lines.length)]!
}

/** Fill `{name}`; if empty, drop the “, {name}” clause. */
export function formatPassSubheader(template: string, name: string): string {
  const who = name.trim()
  if (!who) {
    return template
      .replace(/,\s*\{name\}/g, '')
      .replaceAll('{name}', '')
      .replace(/\s{2,}/g, ' ')
      .trim()
  }
  return template.replaceAll('{name}', who)
}

export function pickPassSubheader(
  kind: 'draw' | 'guess',
  name: string,
): string {
  const pool = kind === 'guess' ? PASS_GUESS_LINES : PASS_DRAW_LINES
  return formatPassSubheader(pickOne(pool), name)
}
