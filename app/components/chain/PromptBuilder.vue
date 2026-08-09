<script setup lang="ts">
import { generatePrompt } from '~/utils/prompts/generatePrompt'

const prompt = defineModel<string>({ required: true })

const props = withDefaults(defineProps<{
  /** When false, prompt is display-only (draw-from-invite). */
  editable?: boolean
}>(), {
  editable: true,
})

const editing = ref(false)

function reroll() {
  if (!props.editable) return
  prompt.value = generatePrompt()
}

function startEdit() {
  if (!props.editable) return
  editing.value = true
}

onMounted(() => {
  if (props.editable && !prompt.value) reroll()
})
</script>

<template>
  <div class="w-full max-w-[min(100%,20rem)]">
    <div class="chip-sketch flex items-center gap-1 rounded-full py-1 pl-3 pr-1">
      <button
        type="button"
        class="font-sketch min-w-0 flex-1 truncate text-left text-sm font-semibold text-[var(--ink)]"
        :class="editable ? '' : 'pointer-events-none'"
        @click="startEdit"
      >
        {{ prompt || 'Tap to set prompt' }}
      </button>
      <button
        v-if="editable"
        type="button"
        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--ink)] transition hover:bg-[var(--paper)]"
        aria-label="Reroll prompt"
        title="New prompt"
        @click="reroll"
      >
        <svg
          viewBox="0 0 24 24"
          class="h-4 w-4"
          fill="none"
          stroke="currentColor"
          stroke-width="2.25"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <rect
            x="3"
            y="3"
            width="18"
            height="18"
            rx="3"
          />
          <circle
            cx="8"
            cy="8"
            r="1.25"
            fill="currentColor"
            stroke="none"
          />
          <circle
            cx="16"
            cy="8"
            r="1.25"
            fill="currentColor"
            stroke="none"
          />
          <circle
            cx="12"
            cy="12"
            r="1.25"
            fill="currentColor"
            stroke="none"
          />
          <circle
            cx="8"
            cy="16"
            r="1.25"
            fill="currentColor"
            stroke="none"
          />
          <circle
            cx="16"
            cy="16"
            r="1.25"
            fill="currentColor"
            stroke="none"
          />
        </svg>
      </button>
    </div>
    <input
      v-if="editable && editing"
      v-model="prompt"
      type="text"
      class="chip-sketch mt-2 w-full rounded-xl px-3 py-2.5 text-base"
      maxlength="120"
      placeholder="Edit prompt"
      @blur="editing = false"
      @keyup.enter="editing = false"
    >
  </div>
</template>
