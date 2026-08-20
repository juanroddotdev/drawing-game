<script setup lang="ts">
import type { DrawingDocument } from '~/types/stroke'
import { createEmptyDocument } from '~/utils/canvas/strokes'
import type { PlayPayload } from '~/types/chain'
import { isExpiredTokenError } from '~/types/chain'
import { mockPlayDraw, mockPlayGuess } from '~/utils/lab/fixtures'
import { stashPassHandoff } from '~/utils/passHandoff'

const route = useRoute()
const api = useChainApi()
const { nickname, email, save } = usePlayerProfile()

const slug = computed(() => String(route.params.chainId || ''))
const token = computed(() => String(route.query.token || ''))
/** Design lab: `/c/lab/play?mock=1&kind=guess|draw&step=N` — local Nuxt only. */
const isMock = computed(() => import.meta.dev && slug.value === 'lab' && String(route.query.mock || '') === '1')

const payload = ref<PlayPayload | null>(null)
const loadError = ref('')
const expired = ref(false)
const busy = ref(false)
const submitError = ref('')
const reopenError = ref('')
const guess = ref('')
const drawing = ref<DrawingDocument>(createEmptyDocument())
const sheetOpen = ref(false)

watch(
  () => drawing.value.strokes.length,
  (n) => {
    if (n > 0) submitError.value = ''
  },
)

watch(guess, () => {
  if (submitError.value) submitError.value = ''
})

useHead({
  title: computed(() => (
    isMock.value
      ? `Lab play — DoodleLoop`
      : `Play — ${slug.value || 'DoodleLoop'}`
  )),
})

function loadMock() {
  const kind = String(route.query.kind || '') === 'draw' ? 'draw' : 'guess'
  const step = Number(route.query.step)
  const stepNumber = Number.isFinite(step) && step > 0 ? step : (kind === 'draw' ? 3 : 2)
  payload.value = kind === 'draw' ? mockPlayDraw(stepNumber) : mockPlayGuess(stepNumber)
  drawing.value = createEmptyDocument()
  guess.value = ''
  loadError.value = ''
  expired.value = false
}

async function load() {
  loadError.value = ''
  expired.value = false
  payload.value = null
  if (isMock.value) {
    loadMock()
    return
  }
  if (!slug.value || !token.value) {
    loadError.value = 'Missing chain link or token.'
    return
  }
  try {
    const data = await api.getPlayPayload(slug.value, token.value)
    if (data.status === 'complete') {
      await navigateTo(`/c/${slug.value}/reveal`)
      return
    }
    payload.value = data
    drawing.value = createEmptyDocument()
    guess.value = ''
  }
  catch (e) {
    const message = e instanceof Error ? e.message : 'Could not load step'
    if (isExpiredTokenError(message)) {
      expired.value = true
      loadError.value = 'This invite expired or was already used.'
    }
    else {
      loadError.value = message
    }
  }
}

function openSubmit() {
  submitError.value = ''
  if (!payload.value) return

  if (payload.value.step_type === 'guess' && !guess.value.trim()) {
    submitError.value = 'Enter a guess.'
    return
  }
  if (payload.value.step_type === 'draw' && drawing.value.strokes.length === 0) {
    submitError.value = 'Empty canvas — draw something first.'
    return
  }
  sheetOpen.value = true
}

async function submit() {
  submitError.value = ''
  if (!payload.value || (!token.value && !isMock.value)) return
  if (!nickname.value.trim()) {
    submitError.value = 'Add a nickname.'
    return
  }

  if (payload.value.step_type === 'guess' && !guess.value.trim()) {
    submitError.value = 'Enter a guess.'
    return
  }
  if (payload.value.step_type === 'draw' && drawing.value.strokes.length === 0) {
    submitError.value = 'Empty canvas — draw something first.'
    return
  }

  if (isMock.value) {
    submitError.value = 'Lab preview — submit is off. Use ← → to keep touring.'
    sheetOpen.value = false
    return
  }

  busy.value = true
  try {
    save()
    const result = await api.submitStep({
      slug: slug.value,
      claimToken: token.value,
      nickname: nickname.value.trim(),
      guessText: payload.value.step_type === 'guess' ? guess.value.trim() : undefined,
      strokeJson: payload.value.step_type === 'draw' ? drawing.value : undefined,
      email: email.value.trim() || undefined,
    })

    sheetOpen.value = false

    if (result.status === 'complete') {
      await navigateTo(`/c/${slug.value}/reveal`)
      return
    }

    stashPassHandoff({
      slug: slug.value,
      kind: payload.value.step_type === 'guess' ? 'guess' : 'draw',
      drawing: payload.value.step_type === 'draw' ? drawing.value : null,
      guessText: payload.value.step_type === 'guess' ? guess.value.trim() : null,
    })

    await navigateTo({
      path: `/c/${slug.value}/pass`,
      query: {
        token: result.claim_token || '',
        step: String(result.next_step || ''),
        done: String(result.completed_step),
        max: String(payload.value.max_steps),
        you: nickname.value.trim(),
      },
    })
  }
  catch (e) {
    const message = e instanceof Error ? e.message : 'Submit failed'
    if (isExpiredTokenError(message)) {
      expired.value = true
      payload.value = null
      sheetOpen.value = false
      loadError.value = 'This invite expired or was already used.'
    }
    else {
      submitError.value = message
    }
  }
  finally {
    busy.value = false
  }
}

async function reopen() {
  reopenError.value = ''
  if (!nickname.value.trim()) {
    reopenError.value = 'Enter the nickname of the last person who played.'
    return
  }
  busy.value = true
  try {
    save()
    const result = await api.reopenSeat(slug.value, nickname.value.trim())
    await navigateTo({
      path: `/c/${slug.value}/pass`,
      query: {
        token: result.claim_token,
        step: String(result.next_step),
        you: nickname.value.trim(),
      },
    })
  }
  catch (e) {
    reopenError.value = e instanceof Error ? e.message : 'Could not reopen seat'
  }
  finally {
    busy.value = false
  }
}

watch(
  () => [route.query.mock, route.query.kind, route.query.step, route.params.chainId],
  () => {
    if (isMock.value) loadMock()
  },
)

onMounted(load)
</script>

<template>
  <!-- Draw: full-bleed canvas shell -->
  <main
    v-if="payload && payload.step_type === 'draw' && !expired && !loadError"
    class="bg-dot-grid relative mx-auto flex h-dvh max-w-lg flex-col text-[var(--ink)]"
  >
    <div class="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-col gap-2 px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <ChainLoopPath
        v-if="payload.step_number"
        mode="play"
        :max-steps="payload.max_steps"
        :current-step="payload.step_number"
        class="pointer-events-auto mx-auto w-full shrink-0"
      />
      <div class="pointer-events-auto flex w-full items-center gap-2">
        <ChainPromptBuilder
          :model-value="payload.prior_guess_text || 'Draw this'"
          :editable="false"
          class="min-w-0 flex-1 [&>div]:max-w-none"
        />
        <button
          type="button"
          class="btn-accent shrink-0 !px-4 !py-2.5 text-sm"
          :disabled="busy"
          @click="openSubmit"
        >
          Done
        </button>
      </div>
    </div>

    <div class="min-h-0 flex-1">
      <CanvasDrawingCanvas v-model="drawing" />
    </div>

    <div class="pointer-events-none absolute inset-x-3 top-[7.25rem] z-30 flex justify-center">
      <UiSketchToast
        :message="submitError"
        @dismiss="submitError = ''"
      />
    </div>

    <UiPlayerSubmitSheet
      v-model:open="sheetOpen"
      v-model:nickname="nickname"
      v-model:email="email"
      title="Submit your drawing"
      confirm-label="Submit drawing"
      :busy="busy"
      :preview="drawing"
      @confirm="submit"
    />
  </main>

  <!-- Guess: stacked doodle + action -->
  <main
    v-else-if="payload && payload.step_type === 'guess' && !expired && !loadError"
    class="bg-dot-grid flex min-h-dvh flex-col text-[var(--ink)]"
  >
    <div
      class="mx-auto flex w-full max-w-lg flex-col gap-3 px-4"
      style="padding-top: max(0.75rem, env(safe-area-inset-top)); padding-bottom: max(1rem, env(safe-area-inset-bottom))"
    >
      <ChainLoopPath
        mode="play"
        :max-steps="payload.max_steps"
        :current-step="payload.step_number || 1"
        class="shrink-0"
      />

      <header class="shrink-0 space-y-1 text-center">
        <h1 class="text-2xl font-bold tracking-tight sm:text-3xl">
          Guess the doodle
        </h1>
        <p class="text-sm font-semibold text-[var(--ink-muted)]">
          What did they draw?
        </p>
      </header>

      <div class="mx-auto flex w-full max-w-sm flex-col gap-2">
        <div
          v-if="payload.prior_stroke_json"
          class="panel-sketch mx-auto aspect-square w-full max-w-[16rem] overflow-hidden p-0 sm:max-w-[18rem]"
        >
          <CanvasStrokeRenderer
            :document="payload.prior_stroke_json"
            bare
            class="h-full w-full"
          />
        </div>

        <form
          class="flex flex-col gap-2"
          @submit.prevent="openSubmit"
        >
          <label class="sr-only" for="guess-input">Your guess</label>
          <input
            id="guess-input"
            v-model="guess"
            type="text"
            maxlength="120"
            class="chip-sketch w-full rounded-[var(--radius-chip)] border-2 border-[var(--ink)] bg-[var(--surface)] px-3 py-3.5 text-base font-semibold outline-none ring-[var(--accent)] focus:ring-2"
            placeholder="Type your guess here…"
            autocomplete="off"
            enterkeyhint="done"
          >
          <button
            type="submit"
            class="btn-accent w-full !py-3.5 text-base disabled:opacity-50"
            :disabled="busy"
          >
            Submit guess
          </button>
        </form>

        <UiSketchToast
          :message="submitError"
          @dismiss="submitError = ''"
        />
      </div>
    </div>

    <UiPlayerSubmitSheet
      v-model:open="sheetOpen"
      v-model:nickname="nickname"
      v-model:email="email"
      title="Submit your guess"
      confirm-label="Submit guess"
      :busy="busy"
      @confirm="submit"
    />
  </main>

  <!-- Loading / errors -->
  <main
    v-else
    class="bg-dot-grid flex min-h-dvh flex-col text-[var(--ink)]"
  >
    <div
      class="mx-auto flex w-full max-w-lg flex-1 flex-col px-4"
      style="padding-top: max(1rem, env(safe-area-inset-top))"
    >
      <ChainLoopPath
        v-if="payload"
        mode="play"
        :max-steps="payload.max_steps"
        :current-step="payload.step_number || 1"
        class="mb-4 shrink-0"
      />

      <div
        v-if="expired"
        class="panel-sketch space-y-3 p-4"
      >
        <p class="text-sm font-medium text-[var(--ink)]">
          {{ loadError }}
        </p>
        <p class="text-sm text-[var(--ink-muted)]">
          If you were the last person to finish a step, re-open the seat and share a new link.
        </p>
        <input
          v-model="nickname"
          type="text"
          maxlength="32"
          class="chip-sketch w-full rounded-[var(--radius-chip)] bg-[var(--surface)] px-3 py-2.5 text-sm font-medium outline-none"
          placeholder="Last completer nickname"
        >
        <p
          v-if="reopenError"
          class="text-sm font-medium text-[var(--danger)]"
        >
          {{ reopenError }}
        </p>
        <button
          type="button"
          class="btn-accent w-full !py-3 text-sm disabled:opacity-50"
          :disabled="busy"
          @click="reopen"
        >
          {{ busy ? 'Working…' : 'Get new share link' }}
        </button>
      </div>

      <p
        v-else-if="loadError"
        class="panel-sketch px-3 py-2 text-sm font-medium text-[var(--danger)]"
      >
        {{ loadError }}
      </p>

      <p
        v-else-if="!expired"
        class="text-sm font-medium text-[var(--ink-muted)]"
      >
        Loading…
      </p>
    </div>
  </main>
</template>
