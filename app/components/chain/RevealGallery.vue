<script setup lang="ts">
import type { RevealPayload, RevealStep } from '~/types/chain'
import { snapEase, travelToDrawT } from '~/utils/revealDrawGesture'

const props = defineProps<{
  reveal: RevealPayload
}>()

type SceneKind =
  | { kind: 'prompt' }
  | { kind: 'step', step: RevealStep }
  | { kind: 'brand' }
  | { kind: 'callback' }

type Scene = SceneKind & {
  cycle: number
  id: string
}

function isDrawScene(s: Scene | null | undefined): s is Scene & { kind: 'step', step: RevealStep } {
  return Boolean(s && s.kind === 'step' && s.step.type === 'draw' && s.step.stroke_json)
}

function buildCycle(cycle: number, includeOpeningPrompt: boolean): Scene[] {
  const list: Scene[] = []
  if (includeOpeningPrompt) {
    list.push({ kind: 'prompt', cycle, id: `${cycle}-prompt` })
  }
  for (const step of props.reveal.steps) {
    list.push({
      kind: 'step',
      step,
      cycle,
      id: `${cycle}-step-${step.step_number}`,
    })
  }
  if (props.reveal.steps.length > 0) {
    list.push(
      { kind: 'brand', cycle, id: `${cycle}-brand` },
      { kind: 'callback', cycle, id: `${cycle}-callback` },
    )
  }
  return list
}

const BRAND_LETTERS = 'DoodleLoop'.split('')
/** Write-on duration before CTA morph */
const BRAND_WRITE_MS = 780

/** Growing timeline — after each close, the journey repeats (endless). */
const timeline = ref<Scene[]>(buildCycle(0, true))
const nextCycle = ref(1)
const index = ref(0)

/** Brand marks that have finished writing and become the landing CTA. */
const brandCtaIds = ref<Record<string, true>>({})

const scene = computed(() => timeline.value[index.value] ?? null)
const canGoBack = computed(() => index.value > 0)

/**
 * How far the icon path has grown (0 = prompt only; N = through step N;
 * max = brand/callback — full path complete).
 */
function pathProgressForScene(s: Scene | null | undefined) {
  const max = props.reveal.steps.length
  if (!s || s.kind === 'prompt') return 0
  if (s.kind === 'step') return s.step.step_number
  return max
}

function pathCompleteForScene(s: Scene | null | undefined) {
  return s?.kind === 'brand' || s?.kind === 'callback'
}

function metaForScene(s: Scene) {
  if (s.kind === 'prompt') {
    return {
      name: props.reveal.creator_nickname,
      badge: 'Prompt',
    }
  }
  if (s.kind === 'step') {
    const kind = s.step.type === 'draw' ? 'Draw' : 'Guess'
    return {
      name: s.step.author_nickname || 'Anonymous',
      badge: `${kind} · ${s.step.step_number}`,
    }
  }
  if (s.kind === 'brand') {
    return { name: 'DoodleLoop', badge: 'Play again' }
  }
  return {
    name: props.reveal.creator_nickname,
    badge: 'The start',
  }
}

let brandTimer: ReturnType<typeof setTimeout> | null = null
let snapTimer: ReturnType<typeof setTimeout> | null = null

const stageRef = ref<HTMLElement | null>(null)
const stageW = ref(1)
const dragX = ref(0)
const dragging = ref(false)
const snapping = ref(false)
const snapDir = ref<'next' | 'back' | null>(null)

const SNAP_MS = 320
const SWIPE_PX = 56
const SWIPE_VX = 0.4

/** Incoming incomplete draw — follows card travel. Completed draws stay at 1. */
const drawT = ref(0)
const completedDrawIds = ref<Record<string, true>>({})

let pointerId: number | null = null
let startX = 0
let startY = 0
let startT = 0
let axis: 'undecided' | 'x' | 'y' = 'undecided'
let drawRaf = 0

const peekScene = computed(() => {
  if (snapDir.value === 'next' || dragX.value < -6) {
    return timeline.value[index.value + 1] ?? null
  }
  if ((snapDir.value === 'back' || dragX.value > 6) && index.value > 0) {
    return timeline.value[index.value - 1] ?? null
  }
  return null
})

const peekX = computed(() => {
  const w = stageW.value
  if (snapDir.value === 'back' || dragX.value > 6) return -w + dragX.value
  return w + dragX.value
})

const layers = computed(() => {
  const current = scene.value
  if (!current) return []
  const list: Array<{ id: string, scene: Scene, x: number, current: boolean }> = []
  if (peekScene.value) {
    list.push({ id: peekScene.value.id, scene: peekScene.value, x: peekX.value, current: false })
  }
  list.push({ id: current.id, scene: current, x: dragX.value, current: true })
  return list
})

function isDrawDone(s: Scene | null | undefined) {
  return Boolean(s && completedDrawIds.value[s.id])
}

function incomingToward(): 'next' | 'back' | null {
  if (snapDir.value === 'next' || dragX.value < -6) return 'next'
  if ((snapDir.value === 'back' || dragX.value > 6) && index.value > 0) return 'back'
  return null
}

function incomingScene(toward: 'next' | 'back' | null) {
  if (toward === 'next') return timeline.value[index.value + 1] ?? null
  if (toward === 'back') return timeline.value[index.value - 1] ?? null
  return null
}

function progressForLayer(layer: { scene: Scene, current: boolean }) {
  if (!isDrawScene(layer.scene)) return 0
  if (isDrawDone(layer.scene)) return 1
  return drawT.value
}

function measureStage() {
  stageW.value = stageRef.value?.clientWidth || 1
}

function clearBrandTimer() {
  if (brandTimer != null) {
    clearTimeout(brandTimer)
    brandTimer = null
  }
}

function clearSnapTimer() {
  if (snapTimer != null) {
    clearTimeout(snapTimer)
    snapTimer = null
  }
}

function ensureRoom() {
  if (index.value < timeline.value.length - 1) return
  timeline.value = [
    ...timeline.value,
    ...buildCycle(nextCycle.value, false),
  ]
  nextCycle.value += 1
}

function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function clearDrawAnim() {
  if (drawRaf) {
    cancelAnimationFrame(drawRaf)
    drawRaf = 0
  }
}

function markCurrentDrawDone() {
  const s = scene.value
  if (!isDrawScene(s)) return
  completedDrawIds.value = { ...completedDrawIds.value, [s.id]: true }
  drawT.value = 1
}

function syncDrawFromTravel() {
  const toward = incomingToward()
  const incoming = incomingScene(toward)
  if (!isDrawScene(incoming) || isDrawDone(incoming)) return
  drawT.value = travelToDrawT(dragX.value, stageW.value, toward)
}

function drawSnapTarget(commit: 'next' | 'back' | null): 0 | 1 | null {
  if (commit === 'next' || commit === 'back') {
    const incoming = incomingScene(commit)
    if (isDrawScene(incoming) && !isDrawDone(incoming)) return 1
    return null
  }
  const toward = incomingToward()
  const incoming = incomingScene(toward)
  if (isDrawScene(incoming) && !isDrawDone(incoming)) return 0
  return null
}

function animateDrawTo(to: 0 | 1) {
  const from = drawT.value
  if (Math.abs(from - to) < 0.001) {
    drawT.value = to
    return
  }
  const start = performance.now()
  const step = (now: number) => {
    const u = Math.min(1, (now - start) / SNAP_MS)
    drawT.value = from + (to - from) * snapEase(u)
    if (u < 1) {
      drawRaf = requestAnimationFrame(step)
      return
    }
    drawT.value = to
    drawRaf = 0
  }
  clearDrawAnim()
  drawRaf = requestAnimationFrame(step)
}

function commitNext() {
  const current = scene.value
  if (current?.kind === 'brand' && !brandCtaIds.value[current.id]) {
    clearBrandTimer()
    brandCtaIds.value = { ...brandCtaIds.value, [current.id]: true }
  }
  clearBrandTimer()
  ensureRoom()
  index.value += 1
  markCurrentDrawDone()
  onSceneEntered()
}

function commitBack() {
  if (!canGoBack.value) return
  clearBrandTimer()
  index.value -= 1
  markCurrentDrawDone()
  onSceneEntered()
}

function snapTo(dir: 'next' | 'back' | null) {
  if (snapping.value) return
  if (dir === 'back' && !canGoBack.value) return
  if (dir === 'next') ensureRoom()
  measureStage()

  const commit = dir
  const toward = dir ?? (dragX.value < -6 ? 'next' : dragX.value > 6 ? 'back' : null)
  const drawTo = drawSnapTarget(commit)

  if (prefersReducedMotion() || stageW.value < 8) {
    if (drawTo != null) drawT.value = drawTo
    if (commit === 'next') commitNext()
    else if (commit === 'back') commitBack()
    else drawT.value = 0
    dragX.value = 0
    snapDir.value = null
    dragging.value = false
    return
  }

  snapDir.value = toward
  dragging.value = false
  if (drawTo === 1) {
    const travelDir = commit === 'back' || toward === 'back' ? 'back' : 'next'
    drawT.value = travelToDrawT(dragX.value, stageW.value, travelDir)
  }
  nextTick(() => {
    snapping.value = true
    dragX.value = commit === 'next'
      ? -stageW.value
      : commit === 'back'
        ? stageW.value
        : 0
    if (drawTo != null) animateDrawTo(drawTo)
    clearSnapTimer()
    snapTimer = setTimeout(() => {
      clearDrawAnim()
      if (drawTo != null) drawT.value = drawTo
      if (commit === 'next') commitNext()
      else if (commit === 'back') commitBack()
      else drawT.value = 0
      dragX.value = 0
      snapDir.value = null
      snapping.value = false
      dragging.value = false
      axis = 'undecided'
    }, SNAP_MS)
  })
}

function goNext() {
  snapTo('next')
}

function goBack() {
  snapTo('back')
}

function isChromeTarget(target: EventTarget | null) {
  return Boolean((target as HTMLElement | null)?.closest('a, button, input, textarea, [data-story-chrome]'))
}

function onPointerDown(e: PointerEvent) {
  if (e.button !== 0) return
  if (snapping.value || isChromeTarget(e.target)) return
  measureStage()
  ensureRoom()
  pointerId = e.pointerId
  startX = e.clientX
  startY = e.clientY
  startT = performance.now()
  axis = 'undecided'
  dragging.value = false
  try {
    stageRef.value?.setPointerCapture(e.pointerId)
  }
  catch {
    /* ignore */
  }
}

function onPointerMove(e: PointerEvent) {
  if (pointerId !== e.pointerId || snapping.value) return
  const dx = e.clientX - startX
  const dy = e.clientY - startY
  if (axis === 'undecided') {
    if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
    axis = Math.abs(dx) > Math.abs(dy) * 1.15 ? 'x' : 'y'
    if (axis === 'x') dragging.value = true
  }
  if (axis !== 'x') return
  e.preventDefault()
  let x = dx
  if (x > 0 && !canGoBack.value) x *= 0.22
  dragX.value = x
  syncDrawFromTravel()
}

function onPointerUp(e: PointerEvent) {
  if (pointerId !== e.pointerId) return
  pointerId = null
  try {
    stageRef.value?.releasePointerCapture(e.pointerId)
  }
  catch {
    /* ignore */
  }

  const dx = dragX.value
  const dt = Math.max(1, performance.now() - startT)
  const vx = (e.clientX - startX) / dt
  const wasDrag = dragging.value && axis === 'x'

  if (!wasDrag) {
    dragX.value = 0
    dragging.value = false
    axis = 'undecided'
    if (isChromeTarget(e.target)) return
    if (Math.abs(e.clientX - startX) < 10 && Math.abs(e.clientY - startY) < 10) {
      const rect = stageRef.value?.getBoundingClientRect()
      if (!rect) return
      if (e.clientX - rect.left < rect.width * 0.28) goBack()
      else goNext()
    }
    return
  }

  const goFwd = dx < -SWIPE_PX || vx < -SWIPE_VX
  const goBwd = canGoBack.value && (dx > SWIPE_PX || vx > SWIPE_VX)
  if (goFwd) snapTo('next')
  else if (goBwd) snapTo('back')
  else snapTo(null)
}

function onSceneEntered() {
  const s = scene.value
  if (!s) return
  if (isDrawScene(s)) markCurrentDrawDone()
  if (s.kind === 'brand' && !brandCtaIds.value[s.id]) {
    brandTimer = setTimeout(() => {
      brandTimer = null
      brandCtaIds.value = { ...brandCtaIds.value, [s.id]: true }
    }, BRAND_WRITE_MS)
  }
}

function onBrandClick(event: MouseEvent, id: string) {
  if (!brandCtaIds.value[id]) {
    event.preventDefault()
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
    e.preventDefault()
    goNext()
  }
  else if (e.key === 'ArrowLeft' || e.key === 'Backspace') {
    e.preventDefault()
    goBack()
  }
}

onMounted(() => {
  onSceneEntered()
  measureStage()
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('resize', measureStage)
})

onBeforeUnmount(() => {
  clearBrandTimer()
  clearSnapTimer()
  clearDrawAnim()
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('resize', measureStage)
})
</script>

<template>
  <div
    class="story relative flex h-full min-h-0 w-full flex-col"
    role="region"
    aria-roledescription="carousel"
    aria-label="Reveal story"
  >
    <header
      class="flex shrink-0 justify-center pb-1.5 pt-0.5"
      data-story-chrome
    >
      <NuxtLink
        to="/"
        class="font-sketch text-xl font-bold leading-none tracking-tight text-[var(--ink)]"
        aria-label="DoodleLoop — home"
      >
        DoodleLoop
      </NuxtLink>
    </header>

    <div
      ref="stageRef"
      class="relative min-h-0 flex-1 touch-pan-y select-none overflow-hidden"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    >
      <div
        v-for="layer in layers"
        :key="layer.id"
        class="story-slide absolute inset-0 flex items-stretch"
        :class="{ 'story-slide--snap': snapping && !dragging }"
        :style="{ transform: `translate3d(${layer.x}px, 0, 0)` }"
      >
        <article
          class="story-card panel-sketch flex h-full w-full min-h-0 flex-col overflow-hidden"
          :aria-hidden="!layer.current"
        >
          <div
            class="story-card__path flex w-full shrink-0 justify-center px-2 pb-1 pt-1.5"
            data-story-chrome
          >
            <ChainLoopPath
              mode="reveal"
              tone="subtle"
              :max-steps="reveal.steps.length"
              :path-progress="pathProgressForScene(layer.scene)"
              :complete="pathCompleteForScene(layer.scene)"
            />
          </div>

          <div
            class="flex shrink-0 items-center justify-between gap-2 border-b border-[var(--ink)]/15 px-3 py-2"
          >
            <p class="min-w-0 truncate text-sm font-bold text-[var(--ink)]">
              {{ metaForScene(layer.scene).name }}
            </p>
            <p
              class="shrink-0 rounded-md border border-[var(--ink)] bg-[var(--surface)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--ink-muted)]"
            >
              {{ metaForScene(layer.scene).badge }}
            </p>
          </div>

          <div class="story-card__body relative min-h-0 flex-1">
            <!-- Brand -->
            <div
              v-if="layer.scene.kind === 'brand'"
              class="flex h-full items-center justify-center p-4"
            >
              <NuxtLink
                to="/play/new"
                class="font-sketch text-4xl font-bold leading-none tracking-tight sm:text-5xl"
                :class="brandCtaIds[layer.scene.id]
                  ? 'brand-write brand-write--cta btn-accent !px-6 !py-4 sm:!px-8 sm:!py-5'
                  : 'brand-write brand-write--plain'"
                :tabindex="brandCtaIds[layer.scene.id] ? undefined : -1"
                :aria-disabled="brandCtaIds[layer.scene.id] ? undefined : 'true'"
                aria-label="DoodleLoop — start a new game"
                data-story-chrome
                @click="onBrandClick($event, layer.scene.id)"
              >
                <span
                  v-for="(ch, li) in BRAND_LETTERS"
                  :key="`${layer.scene.id}-${li}`"
                  class="brand-write__ch"
                  :style="{ '--i': li }"
                >{{ ch }}</span>
              </NuxtLink>
            </div>

            <!-- Callback -->
            <div
              v-else-if="layer.scene.kind === 'callback'"
              class="flex h-full flex-col items-center justify-center p-5 sm:p-6"
            >
              <p class="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
                Back to the start
              </p>
              <p class="mt-4 text-center text-2xl font-bold leading-snug tracking-tight text-[var(--ink)] sm:text-3xl">
                “{{ reveal.prompt_text }}”
              </p>
            </div>

            <!-- Prompt -->
            <div
              v-else-if="layer.scene.kind === 'prompt'"
              class="flex h-full flex-col items-center justify-center p-5 sm:p-6"
            >
              <p class="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
                It started with
              </p>
              <p class="mt-4 text-center text-2xl font-bold leading-snug tracking-tight text-[var(--ink)] sm:text-3xl">
                “{{ reveal.prompt_text }}”
              </p>
            </div>

            <!-- Draw -->
            <div
              v-else-if="layer.scene.kind === 'step' && layer.scene.step.type === 'draw' && layer.scene.step.stroke_json"
              class="flex h-full items-center justify-center p-2"
            >
              <div class="aspect-square h-full max-h-full w-full max-w-full overflow-hidden bg-[var(--canvas)]">
                <CanvasReplayPlayer
                  :key="layer.scene.id"
                  class="h-full w-full"
                  :document="layer.scene.step.stroke_json"
                  :progress="progressForLayer(layer)"
                  :autoplay="false"
                  chrome="overlay"
                />
              </div>
            </div>

            <!-- Guess -->
            <div
              v-else-if="layer.scene.kind === 'step'"
              class="flex h-full items-center justify-center p-5 sm:p-6"
            >
              <p
                v-if="layer.scene.step.guess_text"
                class="px-4 text-center text-2xl font-bold leading-snug text-[var(--ink)] sm:text-3xl"
              >
                “{{ layer.scene.step.guess_text }}”
              </p>
            </div>
          </div>

          <footer
            class="flex shrink-0 items-center justify-between gap-2 border-t border-[var(--ink)] px-2 py-2"
            data-story-chrome
            style="padding-bottom: max(0.25rem, env(safe-area-inset-bottom))"
          >
            <button
              type="button"
              class="btn-quiet flex size-9 items-center justify-center !p-0 disabled:opacity-35"
              :disabled="!layer.current || !canGoBack || snapping"
              aria-label="Back"
              @click="goBack"
            >
              <svg
                viewBox="0 0 24 24"
                class="h-5 w-5"
                fill="none"
                stroke="currentColor"
                stroke-width="2.25"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="m15 6-6 6 6 6" />
              </svg>
            </button>
            <p class="text-center text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
              Swipe to reveal
            </p>
            <button
              type="button"
              class="btn-accent flex size-9 items-center justify-center !p-0 disabled:opacity-50"
              :disabled="!layer.current || snapping"
              aria-label="Next"
              @click="goNext"
            >
              <svg
                viewBox="0 0 24 24"
                class="h-5 w-5"
                fill="none"
                stroke="currentColor"
                stroke-width="2.25"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="m9 6 6 6-6 6" />
              </svg>
            </button>
          </footer>
        </article>
      </div>
    </div>
  </div>
</template>

<style scoped>
.story-slide {
  will-change: transform;
}

.story-slide--snap {
  transition: transform 0.32s cubic-bezier(0.22, 1, 0.36, 1);
}

.story-card {
  max-height: 100%;
}

.story-card__path :deep(> div) {
  max-width: none;
}

.brand-write {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  color: var(--ink);
  text-decoration: none;
}

.brand-write--plain {
  pointer-events: none;
  border: none;
  background: transparent;
  padding: 0;
  box-shadow: none;
}

.brand-write--cta {
  animation: brand-cta-pop 0.48s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.brand-write__ch {
  display: inline-block;
  opacity: 0;
  clip-path: inset(0 100% 0 0);
  transform: translateY(0.12em);
  animation: brand-write-ch 0.32s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
  animation-delay: calc(var(--i) * 0.055s);
}

@keyframes brand-write-ch {
  to {
    opacity: 1;
    clip-path: inset(0 0 0 0);
    transform: translateY(0);
  }
}

@keyframes brand-cta-pop {
  from {
    transform: scale(0.82);
    opacity: 0.7;
  }
  70% {
    transform: scale(1.05);
    opacity: 1;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .story-slide--snap {
    transition: none;
  }

  .brand-write--cta,
  .brand-write__ch {
    animation: none;
    opacity: 1;
    clip-path: none;
    transform: none;
  }
}
</style>
