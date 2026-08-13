export type LabFormFactor = 'mobile' | 'tablet' | 'desktop'

export type LabTourSlide = {
  id: string
  title: string
  blurb: string
  path: string
  query?: Record<string, string>
}

export const LAB_FORM_FACTORS: Array<{
  id: LabFormFactor
  label: string
  /** CSS px — iframe width so Tailwind breakpoints match the device */
  width: number
  height: number
}> = [
  { id: 'mobile', label: 'Mobile', width: 390, height: 844 },
  { id: 'tablet', label: 'Tablet', width: 768, height: 1024 },
  { id: 'desktop', label: 'Desktop', width: 1280, height: 800 },
]

function passQuery(done: number, kind: 'draw' | 'guess') {
  return {
    mock: '1',
    done: String(done),
    max: '6',
    step: String(done + 1),
    you: 'Juan',
    kind,
    token: 'lab-preview',
  }
}

/**
 * Ordered UI review deck — local screen lab only.
 * Guess #1 and #2 use the same shell; both are included so you can compare content context.
 */
export const LAB_TOUR_SLIDES: LabTourSlide[] = [
  {
    id: 'landing',
    title: 'Landing',
    blurb: 'Brand CTA + Draw → Pass → Guess line',
    path: '/',
  },
  {
    id: 'draw-create',
    title: 'Draw · start a loop',
    blurb: 'Editable prompt builder — first drawing',
    path: '/play/new',
  },
  {
    id: 'pass-draw',
    title: 'Pass · after first draw',
    blurb: 'Share handoff — turn locked in (peek optional)',
    path: '/c/lab/pass',
    query: passQuery(1, 'draw'),
  },
  {
    id: 'guess-1',
    title: 'Guess · step 2',
    blurb: 'First guess — sees the opening doodle',
    path: '/c/lab/play',
    query: { mock: '1', kind: 'guess', step: '2' },
  },
  {
    id: 'pass-guess',
    title: 'Pass · after first guess',
    blurb: 'Share handoff — turn locked in (peek optional)',
    path: '/c/lab/pass',
    query: passQuery(2, 'guess'),
  },
  {
    id: 'draw-mid',
    title: 'Draw · step 3',
    blurb: 'Mid-chain draw — locked prompt from prior guess (different from start)',
    path: '/c/lab/play',
    query: { mock: '1', kind: 'draw', step: '3' },
  },
  {
    id: 'guess-2',
    title: 'Guess · step 4',
    blurb: 'Same guess shell as step 2 — different prior drawing',
    path: '/c/lab/play',
    query: { mock: '1', kind: 'guess', step: '4' },
  },
  {
    id: 'pass-late',
    title: 'Pass · late loop',
    blurb: 'Progress path near the end of the chain',
    path: '/c/lab/pass',
    query: passQuery(5, 'draw'),
  },
  {
    id: 'reveal',
    title: 'Reveal · final',
    blurb: 'Story cards — one beat at a time, tap to advance',
    path: '/lab/screens/reveal',
  },
]

export function labTourIndex(tourId: string | null | undefined): number {
  if (!tourId) return -1
  return LAB_TOUR_SLIDES.findIndex(s => s.id === tourId)
}

export function labTourSlide(tourId: string | null | undefined): LabTourSlide | null {
  const i = labTourIndex(tourId)
  return i >= 0 ? LAB_TOUR_SLIDES[i]! : null
}

export function labTourNeighbors(tourId: string | null | undefined) {
  const i = labTourIndex(tourId)
  if (i < 0) return { prev: null, next: null, index: -1, total: LAB_TOUR_SLIDES.length }
  return {
    prev: i > 0 ? LAB_TOUR_SLIDES[i - 1]! : null,
    next: i < LAB_TOUR_SLIDES.length - 1 ? LAB_TOUR_SLIDES[i + 1]! : null,
    index: i,
    total: LAB_TOUR_SLIDES.length,
  }
}

export function parseLabFormFactor(raw: unknown): LabFormFactor {
  if (raw === 'tablet' || raw === 'desktop' || raw === 'mobile') return raw
  return 'mobile'
}

export function labFormFactorMeta(id: LabFormFactor) {
  return LAB_FORM_FACTORS.find(f => f.id === id) ?? LAB_FORM_FACTORS[0]!
}

/** Path + query for embedding a slide (no tour chrome). */
export function labSlideEmbedSrc(slide: LabTourSlide): string {
  const q = new URLSearchParams(slide.query || {})
  const qs = q.toString()
  return qs ? `${slide.path}?${qs}` : slide.path
}

/** Framed viewer route for the slideshow. */
export function labFrameTo(slideId: string, ff: LabFormFactor = 'mobile') {
  return {
    path: '/lab/screens/view',
    query: { slide: slideId, ff },
  }
}
