import type { DrawingDocument } from '~/types/stroke'

const HANDOFF_KEY = 'doodleloop:pass-handoff'

export type PassHandoff = {
  slug: string
  kind: 'draw' | 'guess'
  drawing?: DrawingDocument | null
  guessText?: string | null
}

/** Stash the just-finished turn for the pass screen (same-tab handoff). */
export function stashPassHandoff(data: PassHandoff) {
  if (!import.meta.client) return
  try {
    sessionStorage.setItem(HANDOFF_KEY, JSON.stringify(data))
  }
  catch {
    /* quota / private mode — preview optional */
  }
}

/** Read + clear handoff if it matches this chain. */
export function takePassHandoff(slug: string): PassHandoff | null {
  if (!import.meta.client) return null
  try {
    const raw = sessionStorage.getItem(HANDOFF_KEY)
    if (!raw) return null
    sessionStorage.removeItem(HANDOFF_KEY)
    const parsed = JSON.parse(raw) as PassHandoff
    if (!parsed || parsed.slug !== slug) return null
    return parsed
  }
  catch {
    return null
  }
}

/** Pretty share URL for display — no token query. Copy still uses the full URL. */
export function displayShareUrl(url: string): string {
  if (!url) return '…'
  try {
    const u = new URL(url)
    const host = u.host.replace(/^www\./, '')
    const parts = u.pathname.split('/').filter(Boolean)
    // /c/:slug/play → host/c/slug…
    const slug = parts[0] === 'c' && parts[1] ? parts[1] : ''
    if (!slug) {
      const base = `${host}${u.pathname}`
      return base.length > 40 ? `${base.slice(0, 38)}…` : base
    }
    const shortSlug = slug.length > 8 ? `${slug.slice(0, 8)}…` : slug
    return `${host}/c/${shortSlug}`
  }
  catch {
    return url.length > 40 ? `${url.slice(0, 38)}…` : url
  }
}
