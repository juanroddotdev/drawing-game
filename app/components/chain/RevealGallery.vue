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
/** Write-on duration before CTA morph + compare prompt */
const BRAND_WRITE_MS = 780

/** Growing timeline — after each close, the journey repeats (endless). */
const timeline = ref<Scene[]>(buildCycle(0, true))
const nextCycle = ref(1)

/** Brand marks that have finished writing and become the landing CTA. */
const brandCtaIds = ref<Record<string, true>>({})

/** How many scenes are visible (1-based count). Starts with prompt only. */
const visibleCount = ref(1)
const cardRefs = ref<HTMLElement[]>([])
const sentinelRef = ref<HTMLElement | null>(null)

const visibleScenes = computed(() => timeline.value.slice(0, visibleCount.value))

let revealLock = false
let scrollArmed = false
let ignoreScrollUntil = 0
let callbackTimer: ReturnType<typeof setTimeout> | null = null

/** Icons for steps 1…through (draw/guess path so far on this card). */
function pathThrough(through: number) {
  return Array.from({ length: through }, (_, i) => ({
    n: i + 1,
    type: stepTypeForNumber(i + 1) as StepType,
  }))
}

function setCardRef(el: Element | null, i: number) {
  if (!el) return
  cardRefs.value[i] = el as HTMLElement
}

function clearCallbackTimer() {
  if (callbackTimer != null) {
    clearTimeout(callbackTimer)
    callbackTimer = null
  }
}

/** Frame last guess near the top so brand + prompt can share the viewport. */
function scrollClosingComposition(brandIndex: number) {
  nextTick(() => {
    const guessEl = cardRefs.value[brandIndex - 1]
    if (guessEl) {
      guessEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    cardRefs.value[brandIndex]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  })
}

function scrollToCard(i: number) {
  nextTick(() => {
    const el = cardRefs.value[i]
    const scene = visibleScenes.value[i]
    if (!el || !scene) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  })
}

function ensureRoomToReveal() {
  if (visibleCount.value < timeline.value.length) return
  // Next loop starts on the first turn — callback already restated the prompt
  timeline.value = [
    ...timeline.value,
    ...buildCycle(nextCycle.value, false),
  ]
  nextCycle.value += 1
}

function revealCallbackQuietly() {
  ensureRoomToReveal()
  const next = timeline.value[visibleCount.value]
  if (next?.kind !== 'callback') {
    revealLock = false
    return
  }
  visibleCount.value += 1
  // Stay put — last guess, DoodleLoop, and prompt should already share the view
  ignoreScrollUntil = Date.now() + 600
  window.setTimeout(() => {
    revealLock = false
  }, 200)
}

function revealNext() {
  if (revealLock) return
  revealLock = true
  clearCallbackTimer()
  ensureRoomToReveal()
  visibleCount.value += 1
  const i = visibleCount.value - 1
  const scene = timeline.value[i]
  // Ignore scroll events caused by our own scrollIntoView so we don’t cascade
  ignoreScrollUntil = Date.now() + 850

  if (scene?.kind === 'brand') {
    scrollClosingComposition(i)
    // After write-on: become the landing CTA, then slide in the compare prompt
    callbackTimer = setTimeout(() => {
      callbackTimer = null
      brandCtaIds.value = { ...brandCtaIds.value, [scene.id]: true }
      revealCallbackQuietly()
    }, BRAND_WRITE_MS)
    return
  }

  scrollToCard(i)
  window.setTimeout(() => {
    revealLock = false
  }, 700)
}

function onBrandClick(event: MouseEvent, id: string) {
  if (!brandCtaIds.value[id]) {
    event.preventDefault()
  }
}

/** Sentinel crossed into the lower viewport → reveal next beat. */
function tryRevealFromScroll() {
  if (!scrollArmed || revealLock || Date.now() < ignoreScrollUntil) return
  const el = sentinelRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const vh = window.innerHeight || 1
  // Trigger when the sentinel reaches the lower ~third of the screen
  if (rect.top < vh * 0.72 && rect.bottom > 0) {
    revealNext()
  }
}

function onScrollGesture() {
  scrollArmed = true
  tryRevealFromScroll()
}

onMounted(() => {
  window.addEventListener('scroll', onScrollGesture, { passive: true })
  window.addEventListener('touchmove', onScrollGesture, { passive: true })
  window.addEventListener('wheel', onScrollGesture, { passive: true })
})

onBeforeUnmount(() => {
  clearCallbackTimer()
  window.removeEventListener('scroll', onScrollGesture)
  window.removeEventListener('touchmove', onScrollGesture)
  window.removeEventListener('wheel', onScrollGesture)
})
</script>

<template>
  <div class="relative flex flex-col gap-5 pb-28">
    <!-- Growing timeline -->
    <div class="mx-auto w-full max-w-lg">
      <template
        v-for="(scene, i) in visibleScenes"
        :key="scene.id"
      >
        <div
          v-if="i > 0 && scene.kind !== 'brand' && scene.kind !== 'callback'"
          class="flex justify-center py-8 text-[var(--ink)] sm:py-10"
          aria-hidden="true"
        >
          <!-- Line between earlier beats; arrow only into the latest -->
          <svg
            v-if="i < visibleCount - 1"
            class="h-10 w-4"
            viewBox="0 0 12 40"
            fill="none"
          >
            <path
              d="M7 1 C2 10, 11 18, 5 28 S8 36, 6 39"
              stroke="currentColor"
              stroke-width="2.25"
              stroke-linecap="round"
            />
          </svg>
          <svg
            v-else
            class="h-12 w-5"
            viewBox="0 0 16 48"
            fill="none"
          >
            <path
              d="M8 2 C3 12, 13 20, 8 30 L8 30"
              stroke="currentColor"
              stroke-width="2.25"
              stroke-linecap="round"
            />
            <path
              d="M4 32 L8 40 L12 32"
              stroke="currentColor"
              stroke-width="2.25"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>

        <div
          v-if="scene.kind === 'brand'"
          :ref="(el) => setCardRef(el as Element | null, i)"
          class="reveal-card brand-beat flex items-center justify-center"
        >
          <NuxtLink
            to="/play/new"
            class="font-sketch text-4xl font-bold leading-none tracking-tight sm:text-5xl"
            :class="brandCtaIds[scene.id]
              ? 'brand-write brand-write--cta btn-accent !px-6 !py-4 sm:!px-8 sm:!py-5'
              : 'brand-write brand-write--plain'"
            :tabindex="brandCtaIds[scene.id] ? undefined : -1"
            :aria-disabled="brandCtaIds[scene.id] ? undefined : 'true'"
            aria-label="DoodleLoop — start a new game"
            @click="onBrandClick($event, scene.id)"
          >
            <span
              v-for="(ch, li) in BRAND_LETTERS"
              :key="`${scene.id}-${li}`"
              class="brand-write__ch"
              :style="{ '--i': li }"
            >{{ ch }}</span>
          </NuxtLink>
        </div>

        <div
          v-else-if="scene.kind === 'callback'"
          :ref="(el) => setCardRef(el as Element | null, i)"
          class="reveal-card callback-beat flex items-end"
        >
          <div class="callback-panel panel-sketch w-full p-4 sm:p-5">
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
        </div>

        <div
          v-else
          :ref="(el) => setCardRef(el as Element | null, i)"
          class="panel-sketch reveal-card"
          :class="scene.kind === 'step' && scene.step.type === 'draw' && scene.step.stroke_json
            ? 'overflow-hidden p-0'
            : 'p-4 sm:p-5'"
        >
          <template v-if="scene.kind === 'prompt'">
            <p class="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
              It started with
            </p>
            <p class="mt-3 text-center text-2xl font-bold leading-snug tracking-tight text-[var(--ink)] sm:text-3xl">
              “{{ reveal.prompt_text }}”
            </p>
            <p class="mt-3 text-center text-sm font-semibold text-[var(--ink-muted)]">
              by {{ reveal.creator_nickname }}
            </p>
          </template>

          <template v-else-if="scene.step.type === 'draw' && scene.step.stroke_json">
            <div class="relative">
              <CanvasReplayPlayer
                :key="`${scene.id}-v-${visibleCount}`"
                :document="scene.step.stroke_json"
                :autoplay="i === visibleCount - 1"
                chrome="overlay"
              />
              <div
                class="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-2 p-2.5 opacity-55"
              >
                <div
                  class="flex items-center gap-0.5"
                  role="img"
                  :aria-label="`Through step ${scene.step.step_number}`"
                >
                  <span
                    v-for="node in pathThrough(scene.step.step_number)"
                    :key="node.n"
                    class="flex size-5 items-center justify-center rounded-full border border-[var(--ink)]"
                    :class="node.n === scene.step.step_number
                      ? 'bg-[var(--accent)] text-[var(--ink)]'
                      : 'bg-[var(--ink)] text-white'"
                    :title="node.type === 'draw' ? `Draw · ${node.n}` : `Guess · ${node.n}`"
                  >
                    <svg
                      v-if="node.type === 'draw'"
                      viewBox="0 0 24 24"
                      class="h-2.5 w-2.5"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2.5"
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
                      class="h-2.5 w-2.5"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M7 8h10" />
                      <path d="M7 12h6" />
                      <path d="M21 15a2 2 0 0 1-2 2H8l-4 3V7a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z" />
                    </svg>
                  </span>
                </div>
                <p
                  v-if="scene.step.author_nickname"
                  class="rounded-sm bg-[var(--surface)]/70 px-1.5 py-0.5 text-xs font-semibold text-[var(--ink)]"
                >
                  {{ scene.step.author_nickname }}
                </p>
              </div>
            </div>
          </template>

          <template v-else>
            <div class="flex items-center justify-between gap-2 opacity-45">
              <div
                class="flex items-center gap-0.5"
                role="img"
                :aria-label="`Through step ${scene.step.step_number}`"
              >
                <span
                  v-for="node in pathThrough(scene.step.step_number)"
                  :key="node.n"
                  class="flex size-5 items-center justify-center rounded-full border border-[var(--ink)]"
                  :class="node.n === scene.step.step_number
                    ? 'bg-[var(--accent)] text-[var(--ink)]'
                    : 'bg-[var(--ink)] text-white'"
                  :title="node.type === 'draw' ? `Draw · ${node.n}` : `Guess · ${node.n}`"
                >
                  <svg
                    v-if="node.type === 'draw'"
                    viewBox="0 0 24 24"
                    class="h-2.5 w-2.5"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
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
                    class="h-2.5 w-2.5"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M7 8h10" />
                    <path d="M7 12h6" />
                    <path d="M21 15a2 2 0 0 1-2 2H8l-4 3V7a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z" />
                  </svg>
                </span>
              </div>
              <p
                v-if="scene.step.author_nickname"
                class="text-xs font-semibold text-[var(--ink)]"
              >
                {{ scene.step.author_nickname }}
              </p>
            </div>
            <p
              v-if="scene.step.guess_text"
              class="mt-4 text-center text-2xl font-bold leading-snug text-[var(--ink)] sm:text-3xl"
            >
              “{{ scene.step.guess_text }}”
            </p>
          </template>
        </div>
      </template>

      <!-- Scroll target — approaching reveals the next beat -->
      <div
        ref="sentinelRef"
        class="h-32 w-full"
        aria-hidden="true"
      />
    </div>

    <!-- Thumb-zone scroll cue -->
    <button
      type="button"
      class="scroll-cue fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))] z-20 flex h-12 w-12 items-center justify-center text-[var(--ink)]"
      aria-label="Continue"
      @click="revealNext"
    >
      <svg
        viewBox="0 0 40 56"
        class="h-11 w-8"
        fill="none"
        stroke="currentColor"
        stroke-width="2.2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M19.2 4.5c.4 6.2-.6 12.8.3 19.2.5 3.6-.2 7.4.4 11.1.3 2.1.1 4.2-.1 6.2" />
        <path d="M8.5 32.8c3.8 2.6 7.4 5.8 10.6 9.4 1.2-3.4 3.1-6.6 5.4-9.5" />
        <path
          d="M19.5 42.8c1.1 2.8 1.8 5.6 2.1 8.4"
          stroke-width="1.7"
          opacity="0.55"
        />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.reveal-card {
  scroll-margin-top: 1.5rem;
  scroll-margin-bottom: 7rem;
}

/* Closing beat: last guess near top, DoodleLoop mid, prompt in the same view */
.brand-beat {
  min-height: 30dvh;
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

/* Same chrome as landing hero CTA — pops on after the write */
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

.callback-beat {
  min-height: 0;
  padding-bottom: max(1.5rem, env(safe-area-inset-bottom));
}

.callback-panel {
  opacity: 0;
  transform: translateY(2.75rem);
  animation: callback-rise 0.65s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.scroll-cue {
  opacity: 0.55;
  animation: cue-bob 1.4s ease-in-out infinite;
}

.scroll-cue:hover,
.scroll-cue:focus-visible {
  opacity: 0.9;
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
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes cue-bob {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(0.35rem);
  }
}

@media (prefers-reduced-motion: reduce) {
  .brand-write--cta {
    animation: none;
  }

  .brand-write__ch,
  .callback-panel {
    animation: none;
    opacity: 1;
    clip-path: none;
    transform: none;
  }

  .scroll-cue {
    animation: none;
  }
}
</style>
