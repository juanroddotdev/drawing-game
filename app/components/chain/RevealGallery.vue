<script setup lang="ts">
import type { RevealPayload, RevealStep, StepType } from '~/types/chain'
import { stepTypeForNumber } from '~/types/chain'

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
const pathProgress = computed(() => {
  const s = scene.value
  const max = props.reveal.steps.length
  if (!s || s.kind === 'prompt') return 0
  if (s.kind === 'step') return s.step.step_number
  return max
})

const pathNodes = computed(() => {
  const max = props.reveal.steps.length
  const progress = pathProgress.value
  const complete = scene.value?.kind === 'brand' || scene.value?.kind === 'callback'
  return Array.from({ length: max }, (_, i) => {
    const n = i + 1
    const done = complete || n < progress
    const latest = !complete && n === progress && scene.value?.kind === 'step'
    const next = !complete && (
      (progress === 0 && n === 1) || (progress > 0 && n === progress + 1)
    )
    return {
      n,
      type: stepTypeForNumber(n) as StepType,
      done,
      latest,
      next,
    }
  })
})

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

let pointerId: number | null = null
let startX = 0
let startY = 0
let startT = 0
let axis: 'undecided' | 'x' | 'y' = 'undecided'

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

function commitNext() {
  const current = scene.value
  if (current?.kind === 'brand' && !brandCtaIds.value[current.id]) {
    clearBrandTimer()
    brandCtaIds.value = { ...brandCtaIds.value, [current.id]: true }
  }
  clearBrandTimer()
  ensureRoom()
  index.value += 1
  onSceneEntered()
}

function commitBack() {
  if (!canGoBack.value) return
  clearBrandTimer()
  index.value -= 1
  onSceneEntered()
}

function snapTo(dir: 'next' | 'back' | null) {
  if (snapping.value) return
  if (dir === 'back' && !canGoBack.value) return
  if (dir === 'next') ensureRoom()
  measureStage()

  if (prefersReducedMotion() || stageW.value < 8) {
    if (dir === 'next') commitNext()
    else if (dir === 'back') commitBack()
    dragX.value = 0
    snapDir.value = null
    dragging.value = false
    return
  }

  const commit = dir
  snapDir.value = dir ?? (dragX.value < -6 ? 'next' : dragX.value > 6 ? 'back' : null)
  dragging.value = false
  nextTick(() => {
    snapping.value = true
    dragX.value = commit === 'next'
      ? -stageW.value
      : commit === 'back'
        ? stageW.value
        : 0
    clearSnapTimer()
    snapTimer = setTimeout(() => {
      if (commit === 'next') commitNext()
      else if (commit === 'back') commitBack()
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
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('resize', measureStage)
})
</script>

<template>
  <div
    class="story relative mx-auto flex h-full min-h-[28rem] w-full max-w-lg flex-col"
    role="region"
    aria-roledescription="carousel"
    aria-label="Reveal story"
  >
    <!-- Progress — all slots visible; fill in as the story advances -->
    <div
      class="flex min-h-11 w-full shrink-0 items-center justify-center px-1 pb-3 pt-1"
      data-story-chrome
      role="img"
      :aria-label="pathProgress === 0
        ? `Reveal starting. ${reveal.steps.length} steps.`
        : `Through step ${pathProgress} of ${reveal.steps.length}`"
    >
      <div class="flex w-full max-w-sm items-center px-1">
        <div
          v-for="(node, idx) in pathNodes"
          :key="node.n"
          class="flex min-w-0 items-center"
          :class="idx < pathNodes.length - 1 ? 'flex-1' : 'shrink-0'"
        >
          <span
            class="flex size-9 shrink-0 items-center justify-center rounded-full border border-[var(--ink)] transition-colors duration-300"
            :class="node.done
              ? 'bg-[var(--ink)] text-white'
              : node.latest
                ? 'bg-[var(--accent)] text-[var(--ink)] shadow-block'
                : node.next
                  ? 'bg-[var(--surface)] text-[var(--ink)] shadow-block'
                  : 'bg-[var(--surface)] text-[var(--ink-muted)]'"
            :title="node.type === 'draw' ? `Draw · step ${node.n}` : `Guess · step ${node.n}`"
          >
            <svg
              v-if="node.type === 'draw'"
              viewBox="0 0 24 24"
              class="h-4 w-4"
              fill="none"
              stroke="currentColor"
              stroke-width="2.25"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M12 19 5 12l7-9 2 5 5 2-7 9Z" />
              <path d="m9 15 5-5" />
            </svg>
            <svg
              v-else
              viewBox="0 0 24 24"
              class="h-4 w-4"
              fill="none"
              stroke="currentColor"
              stroke-width="2.25"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M7 8h10" />
              <path d="M7 12h6" />
              <path d="M21 15a2 2 0 0 1-2 2H8l-4 3V7a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z" />
            </svg>
          </span>

          <div
            v-if="idx < pathNodes.length - 1"
            class="flex h-9 min-w-[0.5rem] flex-1 items-center px-0.5"
            aria-hidden="true"
          >
            <svg
              v-if="node.done"
              class="h-3 w-full text-[var(--ink)]"
              viewBox="0 0 40 12"
              preserveAspectRatio="none"
              fill="none"
            >
              <path
                d="M1 7 C10 2, 18 11, 28 5 S36 8, 39 6"
                stroke="currentColor"
                stroke-width="2.25"
                stroke-linecap="round"
              />
            </svg>
            <svg
              v-else-if="node.latest"
              class="h-4 w-full text-[var(--ink)]"
              viewBox="0 0 40 16"
              preserveAspectRatio="xMidYMid meet"
              fill="none"
            >
              <path
                d="M2 8 C12 3, 20 13, 28 8 L28 8"
                stroke="currentColor"
                stroke-width="2.25"
                stroke-linecap="round"
              />
              <path
                d="M24 4 L32 8 L24 12"
                stroke="currentColor"
                stroke-width="2.25"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <div
              v-else
              class="mx-1 h-px w-full bg-[var(--ink)]/20"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Stage: swipe + tap -->
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
        class="story-slide absolute inset-0 flex items-center justify-center"
        :class="{ 'story-slide--snap': snapping && !dragging }"
        :style="{ transform: `translate3d(${layer.x}px, 0, 0)` }"
      >
        <!-- Brand -->
        <div
          v-if="layer.scene.kind === 'brand'"
          class="flex items-center justify-center px-4"
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
          class="callback-panel panel-sketch w-full p-4 sm:p-5"
        >
          <p class="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
            Back to the start
          </p>
          <p class="mt-3 text-center text-2xl font-bold leading-snug tracking-tight text-[var(--ink)] sm:text-3xl">
            “{{ reveal.prompt_text }}”
          </p>
          <p class="mt-3 text-center text-sm font-semibold text-[var(--ink-muted)]">
            by {{ reveal.creator_nickname }}
          </p>
        </div>

        <!-- Prompt -->
        <div
          v-else-if="layer.scene.kind === 'prompt'"
          class="panel-sketch w-full p-4 sm:p-5"
        >
          <p class="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
            It started with
          </p>
          <p class="mt-3 text-center text-2xl font-bold leading-snug tracking-tight text-[var(--ink)] sm:text-3xl">
            “{{ reveal.prompt_text }}”
          </p>
          <p class="mt-3 text-center text-sm font-semibold text-[var(--ink-muted)]">
            by {{ reveal.creator_nickname }}
          </p>
        </div>

        <!-- Draw -->
        <div
          v-else-if="layer.scene.kind === 'step' && layer.scene.step.type === 'draw' && layer.scene.step.stroke_json"
          class="panel-sketch relative aspect-square h-full max-h-full w-auto max-w-full overflow-hidden p-0"
        >
          <CanvasReplayPlayer
            :key="layer.scene.id"
            class="absolute inset-0 h-full w-full"
            :document="layer.scene.step.stroke_json"
            :autoplay="layer.current"
            chrome="overlay"
          />
          <p
            v-if="layer.scene.step.author_nickname"
            class="pointer-events-none absolute right-2.5 top-2.5 z-10 rounded-sm bg-[var(--surface)]/70 px-1.5 py-0.5 text-xs font-semibold text-[var(--ink)]"
          >
            {{ layer.scene.step.author_nickname }}
          </p>
        </div>

        <!-- Guess -->
        <div
          v-else-if="layer.scene.kind === 'step'"
          class="panel-sketch relative w-full p-4 sm:p-5"
        >
          <p
            v-if="layer.scene.step.author_nickname"
            class="absolute right-2.5 top-2.5 text-xs font-semibold text-[var(--ink-muted)]"
          >
            {{ layer.scene.step.author_nickname }}
          </p>
          <p
            v-if="layer.scene.step.guess_text"
            class="px-6 py-8 text-center text-2xl font-bold leading-snug text-[var(--ink)] sm:text-3xl"
          >
            “{{ layer.scene.step.guess_text }}”
          </p>
        </div>
      </div>
    </div>

    <!-- Footer chrome -->
    <div
      class="flex shrink-0 items-center justify-between gap-3 pt-3"
      data-story-chrome
      style="padding-bottom: max(0.25rem, env(safe-area-inset-bottom))"
    >
      <button
        type="button"
        class="btn-quiet !px-2 !py-1.5 text-xs font-semibold disabled:opacity-35"
        :disabled="!canGoBack || snapping"
        @click="goBack"
      >
        Back
      </button>
      <p class="text-center text-[11px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
        Swipe
      </p>
      <button
        type="button"
        class="btn-accent !px-3 !py-1.5 text-xs"
        :disabled="snapping"
        @click="goNext"
      >
        Next
      </button>
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

.callback-panel {
  animation: callback-rise 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
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

@keyframes callback-rise {
  from {
    opacity: 0;
    transform: translateY(1.25rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .story-slide--snap {
    transition: none;
  }

  .brand-write--cta,
  .brand-write__ch,
  .callback-panel {
    animation: none;
    opacity: 1;
    clip-path: none;
    transform: none;
  }
}
</style>
