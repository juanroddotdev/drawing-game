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

/** One segment per beat in the active cycle. */
const segmentCount = computed(() => {
  const steps = props.reveal.steps.length
  if (steps === 0) return 1
  const s = scene.value
  // Opening cycle includes the prompt card
  if (!s || s.cycle === 0) return 1 + steps + 2
  return steps + 2
})

const segmentIndex = computed(() => {
  const s = scene.value
  if (!s) return 0
  if (s.kind === 'prompt') return 0
  if (s.kind === 'step') {
    return s.cycle > 0 ? s.step.step_number - 1 : s.step.step_number
  }
  const brandIdx = s.cycle > 0
    ? props.reveal.steps.length
    : props.reveal.steps.length + 1
  if (s.kind === 'brand') return brandIdx
  return brandIdx + 1
})

let advanceLock = false
let brandTimer: ReturnType<typeof setTimeout> | null = null

function pathThrough(through: number) {
  return Array.from({ length: through }, (_, i) => ({
    n: i + 1,
    type: stepTypeForNumber(i + 1) as StepType,
  }))
}

function clearBrandTimer() {
  if (brandTimer != null) {
    clearTimeout(brandTimer)
    brandTimer = null
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

function goNext() {
  if (advanceLock) return
  const current = scene.value
  if (!current) return

  // Skip waiting on brand write — unlock CTA and continue
  if (current.kind === 'brand' && !brandCtaIds.value[current.id]) {
    clearBrandTimer()
    brandCtaIds.value = { ...brandCtaIds.value, [current.id]: true }
  }

  advanceLock = true
  clearBrandTimer()
  ensureRoom()
  index.value += 1
  onSceneEntered()
  window.setTimeout(() => {
    advanceLock = false
  }, 280)
}

function goBack() {
  if (!canGoBack.value || advanceLock) return
  advanceLock = true
  clearBrandTimer()
  index.value -= 1
  onSceneEntered()
  window.setTimeout(() => {
    advanceLock = false
  }, 280)
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

/** Stories hit zones: left = back, right = next. Ignore interactive chrome. */
function onStagePointer(e: PointerEvent) {
  const target = e.target as HTMLElement | null
  if (target?.closest('a, button, input, textarea, [data-story-chrome]')) return

  const el = e.currentTarget as HTMLElement
  const rect = el.getBoundingClientRect()
  const x = e.clientX - rect.left
  if (x < rect.width * 0.28) goBack()
  else goNext()
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
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  clearBrandTimer()
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div
    class="story relative mx-auto flex h-full min-h-[28rem] w-full max-w-lg flex-col"
    role="region"
    aria-roledescription="carousel"
    aria-label="Reveal story"
  >
    <!-- Progress — Stories-style segments for the loop -->
    <div
      class="flex shrink-0 gap-1 px-1 pb-3 pt-1"
      data-story-chrome
      role="img"
      :aria-label="`Beat ${segmentIndex + 1} of ${segmentCount}`"
    >
      <div
        v-for="n in segmentCount"
        :key="n"
        class="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-[var(--ink)]/15"
      >
        <div
          class="h-full rounded-full bg-[var(--ink)] transition-[width] duration-300 ease-out"
          :style="{
            width: n - 1 < segmentIndex
              ? '100%'
              : n - 1 === segmentIndex
                ? '100%'
                : '0%',
          }"
        />
      </div>
    </div>

    <!-- Stage: one card + tap zones -->
    <div
      class="relative min-h-0 flex-1 touch-manipulation select-none"
      @pointerup="onStagePointer"
    >
      <div
        v-if="scene"
        :key="scene.id"
        class="story-card absolute inset-0 flex flex-col"
      >
        <!-- Brand -->
        <div
          v-if="scene.kind === 'brand'"
          class="flex min-h-0 flex-1 flex-col items-center justify-center px-4"
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
            data-story-chrome
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

        <!-- Callback -->
        <div
          v-else-if="scene.kind === 'callback'"
          class="flex min-h-0 flex-1 flex-col justify-center px-1"
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

        <!-- Prompt / step -->
        <div
          v-else
          class="panel-sketch flex min-h-0 flex-1 flex-col"
          :class="scene.kind === 'step' && scene.step.type === 'draw' && scene.step.stroke_json
            ? 'overflow-hidden p-0'
            : 'justify-center p-4 sm:p-5'"
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
            <div class="relative min-h-0 flex-1">
              <CanvasReplayPlayer
                :key="scene.id"
                :document="scene.step.stroke_json"
                :autoplay="true"
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
        :disabled="!canGoBack"
        @click="goBack"
      >
        Back
      </button>
      <p class="text-center text-[11px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
        Tap to continue
      </p>
      <button
        type="button"
        class="btn-accent !px-3 !py-1.5 text-xs"
        @click="goNext"
      >
        Next
      </button>
    </div>
  </div>
</template>

<style scoped>
.story-card {
  animation: story-in 0.32s cubic-bezier(0.22, 1, 0.36, 1) both;
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

@keyframes story-in {
  from {
    opacity: 0;
    transform: translateY(0.6rem) scale(0.985);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
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
  .story-card,
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
