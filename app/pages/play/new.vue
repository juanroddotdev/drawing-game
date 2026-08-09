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
  <main class="bg-dot-grid relative mx-auto flex h-dvh max-w-lg flex-col text-[var(--ink)]">
    <!-- Floating chrome — only real controls capture clicks -->
    <div class="pointer-events-none absolute inset-x-0 top-0 z-20 px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <NuxtLink
        to="/"
        class="chip-sketch pointer-events-auto absolute left-3 top-[max(0.75rem,env(safe-area-inset-top))] flex h-10 w-10 items-center justify-center rounded-full text-[var(--ink)]"
        aria-label="Home"
        title="Home"
      >
        <svg
          viewBox="0 0 24 24"
          class="h-5 w-5"
          fill="none"
          stroke="currentColor"
          stroke-width="2.25"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="m3 10 9-7 9 7" />
          <path d="M5 10v9a1 1 0 0 0 1 1h4v-5h4v5h4a1 1 0 0 0 1-1v-9" />
        </svg>
      </NuxtLink>
      <div class="mx-auto flex justify-center px-12">
        <div class="pointer-events-auto">
          <ChainPromptBuilder v-model="prompt" />
        </div>
      </div>
    </div>

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

    <p
      v-if="error"
      class="absolute inset-x-4 top-[4.5rem] z-30 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 shadow"
    >
      {{ error }}
    </p>

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
