<script setup lang="ts">
import type { DrawingDocument } from '~/types/stroke'
import { createEmptyDocument } from '~/utils/canvas/strokes'

useHead({ title: 'Start a loop — DoodleLoop' })

const api = useChainApi()
const { nickname, email, save } = usePlayerProfile()

const prompt = ref('')
const drawing = ref<DrawingDocument>(createEmptyDocument())
const busy = ref(false)
const error = ref('')
const sheetOpen = ref(false)

function openSubmit() {
  error.value = ''
  if (!prompt.value.trim()) {
    error.value = 'Add a prompt.'
    return
  }
  if (drawing.value.strokes.length === 0) {
    error.value = 'Draw something first.'
    return
  }
  sheetOpen.value = true
}

async function startChain() {
  error.value = ''
  if (!nickname.value.trim()) {
    error.value = 'Add a nickname.'
    return
  }
  if (!prompt.value.trim()) {
    error.value = 'Add a prompt.'
    return
  }
  if (drawing.value.strokes.length === 0) {
    error.value = 'Draw something first.'
    return
  }

  busy.value = true
  try {
    save()
    const result = await api.createChain({
      promptText: prompt.value.trim(),
      nickname: nickname.value.trim(),
      strokeJson: drawing.value,
      email: email.value.trim() || undefined,
    })
    sheetOpen.value = false
    await navigateTo({
      path: `/c/${result.slug}/pass`,
      query: {
        token: result.claim_token,
        step: String(result.next_step),
        you: nickname.value.trim(),
      },
    })
  }
  catch (e) {
    error.value = e instanceof Error ? e.message : 'Could not create chain'
  }
  finally {
    busy.value = false
  }
}
</script>

<template>
  <main class="flex min-h-dvh flex-col bg-gradient-to-b from-slate-100 to-slate-200 text-slate-900">
    <div class="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pt-4">
      <header class="mb-3 flex items-center justify-between gap-2">
        <NuxtLink
          to="/"
          class="text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          ← Home
        </NuxtLink>
        <span class="text-sm font-semibold text-slate-700">Start a loop</span>
      </header>

      <UiPhoneTip class="mb-3" />

      <div class="mb-3">
        <ChainPromptBuilder v-model="prompt" />
      </div>

      <div class="min-h-0 flex-1">
        <CanvasDrawingCanvas v-model="drawing" />
      </div>

      <p
        v-if="error"
        class="mt-2 text-sm text-red-600"
      >
        {{ error }}
      </p>
    </div>

    <div class="mx-auto w-full max-w-lg px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
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
      title="Submit your drawing"
      confirm-label="Create & share"
      :busy="busy"
      @confirm="startChain"
    />
  </main>
</template>
