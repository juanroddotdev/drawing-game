<script setup lang="ts">
import type { DrawingDocument } from '~/types/stroke'
import { DEFAULT_MAX_STEPS, sharePath, stepTypeForNumber } from '~/types/chain'
import { pickPassSubheader } from '~/utils/passCopy'
import { takePassHandoff, type PassHandoff } from '~/utils/passHandoff'

const route = useRoute()
const slug = computed(() => String(route.params.chainId || ''))
const token = computed(() => String(route.query.token || ''))
const nextStep = computed(() => {
  const n = Number(route.query.step)
  return Number.isFinite(n) && n > 0 ? n : 0
})
const completedStep = computed(() => {
  const done = Number(route.query.done)
  if (Number.isFinite(done) && done > 0) return done
  return nextStep.value > 0 ? nextStep.value - 1 : 0
})
const maxSteps = computed(() => {
  const m = Number(route.query.max)
  return Number.isFinite(m) && m >= 2 ? m : DEFAULT_MAX_STEPS
})
const you = computed(() => String(route.query.you || ''))

const absoluteUrl = computed(() => {
  if (!import.meta.client) return ''
  return `${window.location.origin}${sharePath(slug.value, token.value)}`
})

const stepLabel = computed(() => (
  nextStep.value ? `step ${nextStep.value}` : 'the next step'
))

const loopSteps = computed(() =>
  Array.from({ length: maxSteps.value }, (_, i) => {
    const n = i + 1
    return {
      n,
      type: stepTypeForNumber(n),
      done: n <= completedStep.value,
      latest: n === completedStep.value,
      next: n === completedStep.value + 1,
    }
  }),
)

const { enabled: showDevTools } = useDevTools()
/** Play-next / inspector — local Nuxt only, never production/Vercel builds. */
const showAdvanced = computed(() => import.meta.dev && showDevTools.value)
const advancedOpen = ref(false)

const handoff = ref<PassHandoff | null>(null)
const subheader = ref('')

const previewDrawing = computed(() => {
  const doc = handoff.value?.drawing
  if (!doc || !doc.strokes?.length) return null
  return doc as DrawingDocument
})

onMounted(() => {
  handoff.value = takePassHandoff(slug.value)
  const kind = handoff.value?.kind
    ?? (completedStep.value > 0 ? stepTypeForNumber(completedStep.value) : 'draw')
  subheader.value = pickPassSubheader(kind, you.value)
})

useHead({ title: 'Who’s next? — DoodleLoop' })
</script>

<template>
  <main class="bg-dot-grid flex h-dvh flex-col overflow-y-auto text-[var(--ink)]">
    <div
      class="mx-auto flex w-full max-w-lg flex-1 flex-col px-4"
      style="padding-top: max(1.25rem, env(safe-area-inset-top)); padding-bottom: max(1.25rem, env(safe-area-inset-bottom))"
    >
      <!-- Top: loop path — lines through done steps, arrow into the next -->
      <div
        v-if="completedStep > 0"
        class="flex w-full max-w-sm shrink-0 items-start self-center px-1"
        role="img"
        :aria-label="`Step ${completedStep} of ${maxSteps} complete. Next is step ${completedStep + 1}.`"
      >
        <template
          v-for="(step, idx) in loopSteps"
          :key="step.n"
        >
          <div class="flex w-10 shrink-0 flex-col items-center gap-1">
            <span
              class="flex size-9 items-center justify-center rounded-full border border-[var(--ink)]"
              :class="step.done
                ? (step.latest
                  ? 'bg-[var(--accent)] text-[var(--ink)] shadow-block'
                  : 'bg-[var(--ink)] text-white')
                : step.next
                  ? 'bg-[var(--surface)] text-[var(--ink)] shadow-block'
                  : 'bg-[var(--surface)] text-[var(--ink-muted)]'"
              :title="step.type === 'draw' ? `Draw · step ${step.n}` : `Guess · step ${step.n}`"
            >
              <svg
                v-if="step.type === 'draw'"
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
            <span
              v-if="step.latest && you"
              class="max-w-[2.75rem] truncate text-center text-[10px] font-bold leading-tight text-[var(--ink)]"
            >
              {{ you }}
            </span>
          </div>

          <!-- Connector after this step (except last) -->
          <div
            v-if="idx < loopSteps.length - 1"
            class="flex h-9 min-w-[0.5rem] flex-1 items-center"
            aria-hidden="true"
          >
            <!-- Drawn path between finished steps -->
            <svg
              v-if="step.n < completedStep"
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
            <!-- Arrow into the next open step -->
            <svg
              v-else-if="step.n === completedStep"
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
          </div>
        </template>
      </div>

      <!-- Middle: title, tease, high-five — fills leftover height -->
      <div class="flex min-h-0 flex-1 flex-col items-center justify-center gap-5 py-6">
        <header class="space-y-2 text-center">
          <h1 class="text-3xl font-bold tracking-tight sm:text-4xl">
            Who’s next?
          </h1>
          <p class="mx-auto max-w-sm text-sm font-medium leading-snug text-[var(--ink-muted)] sm:text-base">
            {{ subheader || `Share so someone can play ${stepLabel}.` }}
          </p>
        </header>

        <div
          v-if="previewDrawing"
          class="flex justify-center"
        >
          <div
            class="pass-preview w-[9.5rem] overflow-hidden border border-[var(--ink)] bg-[var(--canvas)] shadow-block sm:w-[10.5rem]"
            aria-hidden="true"
          >
            <CanvasStrokeRenderer
              :document="previewDrawing"
              bare
            />
          </div>
        </div>

        <div
          v-else-if="handoff?.kind === 'guess' && handoff.guessText"
          class="chip-sketch w-full max-w-sm rounded-[var(--radius-chip)] px-4 py-3 text-center text-sm font-semibold text-[var(--ink)]"
        >
          “{{ handoff.guessText }}”
        </div>
      </div>

      <!-- Bottom: share CTAs + quiet links -->
      <div class="flex shrink-0 flex-col gap-3">
        <ChainShareTurn
          :url="absoluteUrl"
          :step-label="stepLabel"
        />

        <div class="flex flex-col items-center gap-2">
          <NuxtLink
            :to="`/c/${slug}/reveal`"
            class="btn-quiet !px-2 !py-1 text-xs font-semibold"
          >
            View the reveal
          </NuxtLink>

          <template v-if="showAdvanced">
            <button
              type="button"
              class="btn-quiet !px-2 !py-1 text-xs"
              @click="advancedOpen = !advancedOpen"
            >
              {{ advancedOpen ? 'Hide advanced' : 'Advanced ▾' }}
            </button>
            <div
              v-if="advancedOpen"
              class="flex w-full flex-wrap justify-center gap-2 rounded-xl border border-dashed border-slate-400/80 bg-white/50 p-3"
            >
              <NuxtLink
                v-if="token"
                :to="`/c/${slug}/play?token=${encodeURIComponent(token)}`"
                class="rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-slate-950"
              >
                Play next step myself
              </NuxtLink>
              <NuxtLink
                :to="`/c/${slug}/dev`"
                class="rounded-xl border border-dashed border-slate-400 bg-white/70 px-4 py-3 text-sm font-semibold text-slate-700"
              >
                Dev inspector
              </NuxtLink>
            </div>
          </template>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.pass-preview {
  transform: rotate(-2deg);
}
</style>
