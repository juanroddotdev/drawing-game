<script setup lang="ts">
import type { DrawingDocument } from '~/types/stroke'
import { createEmptyDocument } from '~/utils/canvas/strokes'
import type { PlayPayload } from '~/types/chain'
import { isExpiredTokenError } from '~/types/chain'

const route = useRoute()
const api = useChainApi()
const { nickname, email, save } = usePlayerProfile()

const slug = computed(() => String(route.params.chainId || ''))
const token = computed(() => String(route.query.token || ''))

const payload = ref<PlayPayload | null>(null)
const loadError = ref('')
const expired = ref(false)
const busy = ref(false)
const submitError = ref('')
const reopenError = ref('')
const guess = ref('')
const drawing = ref<DrawingDocument>(createEmptyDocument())
const sheetOpen = ref(false)

useHead({
  title: computed(() => `Play — ${slug.value || 'DoodleLoop'}`),
})

async function load() {
  loadError.value = ''
  expired.value = false
  payload.value = null
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
    submitError.value = 'Draw something first.'
    return
  }
  sheetOpen.value = true
}

async function submit() {
  submitError.value = ''
  if (!payload.value || !token.value) return
  if (!nickname.value.trim()) {
    submitError.value = 'Add a nickname.'
    return
  }

  if (payload.value.step_type === 'guess' && !guess.value.trim()) {
    submitError.value = 'Enter a guess.'
    return
  }
  if (payload.value.step_type === 'draw' && drawing.value.strokes.length === 0) {
    submitError.value = 'Draw something first.'
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

    await navigateTo({
      path: `/c/${slug.value}/pass`,
      query: {
        token: result.claim_token || '',
        step: String(result.next_step || ''),
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

onMounted(load)
</script>

<template>
  <main class="flex min-h-dvh flex-col bg-gradient-to-b from-slate-100 to-slate-200 text-slate-900">
    <div class="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pt-4">
      <header class="mb-3 space-y-1">
        <NuxtLink
          :to="`/c/${slug}`"
          class="text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          Chain status
        </NuxtLink>
        <p
          v-if="payload"
          class="text-sm text-slate-600"
        >
          Step {{ payload.step_number }} of {{ payload.max_steps }}
          · {{ payload.step_type === 'guess' ? 'Guess' : 'Draw' }}
        </p>
      </header>

      <div
        v-if="expired"
        class="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4"
      >
        <p class="text-sm text-amber-950">
          {{ loadError }}
        </p>
        <p class="text-sm text-amber-900/80">
          If you were the last person to finish a step, re-open the seat and share a new link.
        </p>
        <input
          v-model="nickname"
          type="text"
          maxlength="32"
          class="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm"
          placeholder="Last completer nickname"
        >
        <p
          v-if="reopenError"
          class="text-sm text-red-600"
        >
          {{ reopenError }}
        </p>
        <button
          type="button"
          class="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
          :disabled="busy"
          @click="reopen"
        >
          {{ busy ? 'Working…' : 'Get new share link' }}
        </button>
      </div>

      <p
        v-else-if="loadError"
        class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
      >
        {{ loadError }}
      </p>

      <template v-else-if="payload && payload.step_type === 'guess'">
        <div class="flex min-h-0 flex-1 flex-col gap-3 pb-28">
          <h1 class="text-lg font-bold tracking-tight">
            What is this?
          </h1>
          <CanvasStrokeRenderer
            v-if="payload.prior_stroke_json"
            :document="payload.prior_stroke_json"
          />
          <label class="block space-y-2">
            <span class="text-sm font-medium text-slate-700">Your guess</span>
            <input
              v-model="guess"
              type="text"
              maxlength="120"
              class="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base"
              placeholder="Type your guess"
              autocomplete="off"
            >
          </label>
          <p
            v-if="submitError"
            class="text-sm text-red-600"
          >
            {{ submitError }}
          </p>
        </div>
      </template>

      <template v-else-if="payload && payload.step_type === 'draw'">
        <div
          v-if="payload.prior_guess_text"
          class="mb-3 truncate rounded-full border border-slate-200 bg-white px-4 py-2 text-center text-sm font-semibold text-slate-900 shadow-sm"
        >
          {{ payload.prior_guess_text }}
        </div>

        <div class="min-h-0 flex-1">
          <CanvasDrawingCanvas v-model="drawing" />
        </div>

        <p
          v-if="submitError"
          class="mt-2 text-sm text-red-600"
        >
          {{ submitError }}
        </p>
      </template>

      <p
        v-else-if="!expired"
        class="text-sm text-slate-500"
      >
        Loading…
      </p>
    </div>

    <!-- Fixed submit for guess (keyboard-safe) -->
    <div
      v-if="payload && payload.step_type === 'guess' && !expired && !loadError"
      class="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200/80 bg-slate-100/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-slate-100/80"
      style="padding-bottom: max(0.75rem, env(safe-area-inset-bottom))"
    >
      <div class="mx-auto max-w-lg">
        <button
          type="button"
          class="w-full rounded-2xl bg-slate-900 px-4 py-4 text-base font-semibold text-white disabled:opacity-50"
          :disabled="busy"
          @click="openSubmit"
        >
          Submit guess
        </button>
      </div>
    </div>

    <!-- Done bar for draw -->
    <div
      v-if="payload && payload.step_type === 'draw' && !expired && !loadError"
      class="mx-auto w-full max-w-lg px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2"
    >
      <button
        type="button"
        class="w-full rounded-2xl bg-slate-900 px-4 py-4 text-base font-semibold text-white disabled:opacity-50"
        :disabled="busy"
        @click="openSubmit"
      >
        Done
      </button>
    </div>

    <UiPlayerSubmitSheet
      v-model:open="sheetOpen"
      v-model:nickname="nickname"
      v-model:email="email"
      :title="payload?.step_type === 'guess' ? 'Submit your guess' : 'Submit your drawing'"
      :confirm-label="payload?.step_type === 'guess' ? 'Submit guess' : 'Submit drawing'"
      :busy="busy"
      @confirm="submit"
    />
  </main>
</template>
