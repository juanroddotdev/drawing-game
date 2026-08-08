import { finishedEmailHtml, sendAppEmail, turnEmailHtml } from '../utils/email'

type Body = {
  type: 'turn' | 'finished'
  to: string
  playUrl?: string
  revealUrl?: string
  stepLabel?: string
  nickname?: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<Body>(event)

  if (!body?.to || !body?.type) {
    throw createError({ statusCode: 400, statusMessage: 'to and type required' })
  }

  if (body.type === 'turn') {
    if (!body.playUrl) {
      throw createError({ statusCode: 400, statusMessage: 'playUrl required' })
    }
    const result = await sendAppEmail({
      to: body.to,
      subject: 'Your turn on DoodleLoop',
      html: turnEmailHtml({
        nickname: body.nickname,
        playUrl: body.playUrl,
        stepLabel: body.stepLabel || 'the next step',
      }),
      idempotencyKey: `turn/${body.to}/${body.playUrl}`.slice(0, 256),
    })
    return result
  }

  if (!body.revealUrl) {
    throw createError({ statusCode: 400, statusMessage: 'revealUrl required' })
  }

  return await sendAppEmail({
    to: body.to,
    subject: 'Your DoodleLoop reveal is ready',
    html: finishedEmailHtml({ revealUrl: body.revealUrl }),
    idempotencyKey: `finished/${body.to}/${body.revealUrl}`.slice(0, 256),
  })
})
