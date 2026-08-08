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
  <main class="min-h-dvh bg-gradient-to-b from-slate-100 to-slate-200 px-4 py-8 text-slate-900">
    <div class="mx-auto flex max-w-lg flex-col gap-6">
      <header class="space-y-1">
        <NuxtLink
          to="/"
          class="text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          ← Home
        </NuxtLink>
        <h1 class="text-2xl font-bold tracking-tight">
          Start a loop
        </h1>
        <p class="text-sm text-slate-600">
          Draw the prompt, then pass a link to a friend to guess.
        </p>
      </header>

      <UiPhoneTip />

      <label class="block space-y-2">
        <span class="text-sm font-medium text-slate-700">Your nickname</span>
        <input
          v-model="nickname"
          type="text"
          maxlength="32"
          class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          placeholder="Alex"
        >
      </label>

      <label class="block space-y-2">
        <span class="text-sm font-medium text-slate-700">Email <span class="font-normal text-slate-500">(optional — for finish notice later)</span></span>
        <input
          v-model="email"
          type="email"
          autocomplete="email"
          class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          placeholder="you@example.com"
        >
      </label>

      <ChainPromptBuilder v-model="prompt" />

      <div class="space-y-2">
        <h2 class="text-sm font-medium text-slate-700">
          Your drawing
        </h2>
        <CanvasDrawingCanvas v-model="drawing" />
      </div>

      <p
        v-if="error"
        class="text-sm text-red-600"
      >
        {{ error }}
      </p>

      <button
        type="button"
        class="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
        :disabled="busy"
        @click="startChain"
      >
        {{ busy ? 'Creating…' : 'Create & get share link' }}
      </button>
    </div>
  </main>
</template>
