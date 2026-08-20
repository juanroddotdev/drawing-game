<script setup lang="ts">
import type { DrawingDocument } from '~/types/stroke'
import { DEFAULT_MAX_STEPS, sharePath, stepTypeForNumber } from '~/types/chain'
import { mockPassDrawing } from '~/utils/lab/fixtures'
import { pickPassSubheader } from '~/utils/passCopy'
import { takePassHandoff, type PassHandoff } from '~/utils/passHandoff'

const route = useRoute()
const slug = computed(() => String(route.params.chainId || ''))
const token = computed(() => String(route.query.token || ''))
/** Design lab: `/c/lab/pass?mock=1&done=4&…` — local Nuxt only. */
const isMock = computed(() => import.meta.dev && String(route.query.mock || '') === '1')
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
  if (isMock.value) {
    return `${window.location.origin}/c/labdemo/play?token=preview`
  }
  return `${window.location.origin}${sharePath(slug.value, token.value)}`
})

const stepLabel = computed(() => (
  nextStep.value ? `step ${nextStep.value}` : 'the next step'
))

const { enabled: showDevTools } = useDevTools()
/** Play-next / inspector — local Nuxt only, never production/Vercel builds. */
const showAdvanced = computed(() => import.meta.dev && showDevTools.value && !isMock.value)
const advancedOpen = ref(false)

const handoff = ref<PassHandoff | null>(null)
const subheader = ref('')
/** Spoiler content stays hidden until the player explicitly peeks. */
const peekOpen = ref(false)

const previewDrawing = computed(() => {
  const doc = handoff.value?.drawing
  if (!doc || !doc.strokes?.length) return null
  return doc as DrawingDocument
})

const canPeek = computed(() =>
  Boolean(previewDrawing.value || (handoff.value?.kind === 'guess' && handoff.value.guessText)),
)

const lockedHint = computed(() => (
  handoff.value?.kind === 'guess'
    ? 'Guess sealed — don’t flash this at the next player.'
    : 'Drawing sealed — don’t flash this at the next player.'
))

onMounted(() => {
  if (isMock.value) {
    const kind = String(route.query.kind || '') === 'guess' ? 'guess' : 'draw'
    handoff.value = {
      slug: slug.value || 'lab',
      kind,
      drawing: kind === 'draw' ? mockPassDrawing() : null,
      guessText: kind === 'guess' ? 'a hairy potato on wheels' : null,
    }
    subheader.value = pickPassSubheader(kind, you.value || 'Juan')
    return
  }

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
      <!-- Top: loop path -->
      <ChainLoopPath
        v-if="completedStep > 0"
        mode="pass"
        :max-steps="maxSteps"
        :completed-step="completedStep"
        :you="you"
        class="shrink-0 self-center"
      />

      <!-- Middle: title, locked status, share hero -->
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
          class="chip-sketch flex w-full max-w-sm items-start gap-3 rounded-[var(--radius-chip)] px-4 py-3"
          role="status"
        >
          <span
            class="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full border border-[var(--ink)] bg-[var(--accent)] text-[var(--ink)] shadow-block"
            aria-hidden="true"
          >
            <svg
              viewBox="0 0 24 24"
              class="h-4 w-4"
              fill="none"
              stroke="currentColor"
              stroke-width="2.25"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect
                x="5"
                y="11"
                width="14"
                height="10"
                rx="2"
              />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" />
            </svg>
          </span>
          <div class="min-w-0 flex-1 text-left">
            <p class="text-sm font-bold tracking-tight text-[var(--ink)]">
              Turn locked in
            </p>
            <p class="mt-0.5 text-xs font-medium leading-snug text-[var(--ink-muted)]">
              {{ lockedHint }}
            </p>
          </div>
        </div>

        <div class="w-full max-w-sm">
          <ChainShareTurn
            :url="absoluteUrl"
            :step-label="stepLabel"
          />
        </div>

        <div
          v-if="canPeek"
          class="flex w-full max-w-sm flex-col items-center gap-3"
        >
          <button
            type="button"
            class="btn-quiet !px-2 !py-1 text-xs font-semibold"
            :aria-expanded="peekOpen"
            @click="peekOpen = !peekOpen"
          >
            {{ peekOpen ? 'Hide your turn' : 'Peek at your turn' }}
          </button>

          <div
            v-if="peekOpen && previewDrawing"
            class="flex justify-center"
          >
            <div
              class="pass-preview w-[9.5rem] overflow-hidden border border-[var(--ink)] bg-[var(--canvas)] shadow-block sm:w-[10.5rem]"
              aria-label="Your drawing preview"
            >
              <CanvasStrokeRenderer
                :document="previewDrawing"
                bare
              />
            </div>
          </div>

          <div
            v-else-if="peekOpen && handoff?.kind === 'guess' && handoff.guessText"
            class="chip-sketch w-full rounded-[var(--radius-chip)] px-4 py-3 text-center text-sm font-semibold text-[var(--ink)]"
          >
            “{{ handoff.guessText }}”
          </div>
        </div>
      </div>

      <!-- Bottom: quiet links -->
      <div class="flex shrink-0 flex-col items-center gap-2">
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
  </main>
</template>

<style scoped>
.pass-preview {
  transform: rotate(-2deg);
}
</style>
