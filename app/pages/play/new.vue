<script setup lang="ts">
import type { DrawingDocument } from '~/types/stroke'
import { createEmptyDocument } from '~/utils/canvas/strokes'
import { stashPassHandoff } from '~/utils/passHandoff'

useHead({ title: 'Start a loop — DoodleLoop' })

const api = useChainApi()
const { nickname, email, save } = usePlayerProfile()

const prompt = ref('')
const drawing = ref<DrawingDocument>(createEmptyDocument())
const busy = ref(false)
const error = ref('')
const sheetOpen = ref(false)

watch(
  () => drawing.value.strokes.length,
  (n) => {
    if (n > 0) error.value = ''
  },
)

watch(prompt, () => {
  if (error.value) error.value = ''
})

function openSubmit() {
  error.value = ''
  if (!prompt.value.trim()) {
    error.value = 'Add a prompt.'
    return
  }
  if (drawing.value.strokes.length === 0) {
    error.value = 'Empty canvas — draw something first.'
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
    error.value = 'Empty canvas — draw something first.'
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
    stashPassHandoff({
      slug: result.slug,
      kind: 'draw',
      drawing: drawing.value,
    })
    await navigateTo({
      path: `/c/${result.slug}/pass`,
      query: {
        token: result.claim_token,
        step: String(result.next_step),
        done: '1',
        max: String(result.max_steps),
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
        class="chip-sketch pointer-events-auto absolute left-3 top-[max(0.75rem,env(safe-area-inset-top))] flex h-10 w-10 items-center justify-center rounded-xl text-[var(--ink)]"
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

    <div class="pointer-events-none absolute inset-x-3 top-[4.25rem] z-30 flex justify-center">
      <UiSketchToast
        :message="error"
        @dismiss="error = ''"
      />
    </div>

    <UiPlayerSubmitSheet
      v-model:open="sheetOpen"
      v-model:nickname="nickname"
      v-model:email="email"
      title="Submit your drawing"
      confirm-label="Create & share"
      :busy="busy"
      :preview="drawing"
      @confirm="startChain"
    />
  </main>
</template>
