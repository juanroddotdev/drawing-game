import { Resend } from 'resend'

export type SendEmailInput = {
  to: string | string[]
  subject: string
  html: string
  text?: string
  idempotencyKey?: string
}

/** Server-only Resend helper. No-ops when RESEND_API_KEY is missing. */
export async function sendAppEmail(input: SendEmailInput) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return { skipped: true as const, reason: 'RESEND_API_KEY not set' }
  }

  const from = process.env.RESEND_FROM_EMAIL || 'DoodleLoop <onboarding@resend.dev>'
  const resend = new Resend(apiKey)

  const { data, error } = await resend.emails.send({
    from,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
    idempotencyKey: input.idempotencyKey,
  })

  if (error) {
    return { skipped: false as const, error }
  }

  return { skipped: false as const, data }
}

export function turnEmailHtml(opts: { nickname?: string, playUrl: string, stepLabel: string }) {
  const who = opts.nickname ? `${opts.nickname}, y` : 'Y'
  return `
    <p>${who}ou're up on <strong>DoodleLoop</strong> (${opts.stepLabel}).</p>
    <p><a href="${opts.playUrl}">Take your turn</a></p>
  `
}

export function finishedEmailHtml(opts: { revealUrl: string }) {
  return `
    <p>Your DoodleLoop chain is done.</p>
    <p><a href="${opts.revealUrl}">See the reveal</a></p>
  `
}
