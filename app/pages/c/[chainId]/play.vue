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
    <div class="pointer-events-none absolute inset-x-0 top-0 z-20 px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div class="mx-auto flex justify-center px-4">
        <div class="pointer-events-auto">
          <ChainPromptBuilder
            :model-value="payload.prior_guess_text || 'Draw this'"
            :editable="false"
          />
        </div>
      </div>
    </div>

    <p
      v-if="payload"
      class="pointer-events-none absolute inset-x-0 top-[3.25rem] z-10 text-center text-[11px] font-bold text-[var(--ink-muted)]"
    >
      Step {{ payload.step_number }} of {{ payload.max_steps }}
    </p>

    <div class="min-h-0 flex-1">
      <CanvasDrawingCanvas v-model="drawing">
        <template #action>
          <button
            type="button"
            class="btn-accent !px-4 !py-2 text-sm"
            :disabled="busy"
            @click="openSubmit"
          >
            Done
          </button>
        </template>
      </CanvasDrawingCanvas>
    </div>

    <div class="pointer-events-none absolute inset-x-3 top-[4.5rem] z-30 flex justify-center">
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

  <!-- Guess / loading / errors -->
  <main
    v-else
    class="bg-dot-grid flex min-h-dvh flex-col text-[var(--ink)]"
  >
    <div
      class="mx-auto flex w-full max-w-lg flex-1 flex-col px-4"
      style="padding-top: max(1rem, env(safe-area-inset-top))"
    >
      <header
        v-if="payload"
        class="mb-4"
      >
        <p class="text-center text-[11px] font-bold text-[var(--ink-muted)]">
          Step {{ payload.step_number }} of {{ payload.max_steps }}
          · Guess
        </p>
      </header>

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

      <template v-else-if="payload && payload.step_type === 'guess'">
        <div class="flex min-h-0 flex-1 flex-col gap-4 pb-28">
          <h1 class="text-2xl font-bold tracking-tight">
            What is this?
          </h1>
          <CanvasStrokeRenderer
            v-if="payload.prior_stroke_json"
            :document="payload.prior_stroke_json"
          />
          <label class="block space-y-2">
            <span class="text-sm font-bold text-[var(--ink)]">Your guess</span>
            <input
              v-model="guess"
              type="text"
              maxlength="120"
              class="chip-sketch w-full rounded-[var(--radius-chip)] bg-[var(--surface)] px-3 py-3 text-base font-medium outline-none"
              placeholder="Type your guess"
              autocomplete="off"
            >
          </label>
          <UiSketchToast
            :message="submitError"
            class="mt-1"
            @dismiss="submitError = ''"
          />
        </div>
      </template>

      <p
        v-else-if="!expired"
        class="text-sm font-medium text-[var(--ink-muted)]"
      >
        Loading…
      </p>
    </div>

    <div
      v-if="payload && payload.step_type === 'guess' && !expired && !loadError"
      class="fixed inset-x-0 bottom-0 z-20 bg-[var(--paper)]/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-[var(--paper)]/85"
      style="padding-bottom: max(0.75rem, env(safe-area-inset-bottom))"
    >
      <div class="mx-auto max-w-lg">
        <button
          type="button"
          class="btn-accent w-full !py-4 text-base disabled:opacity-50"
          :disabled="busy"
          @click="openSubmit"
        >
          Submit guess
        </button>
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
</template>
