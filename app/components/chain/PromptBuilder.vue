<script setup lang="ts">
import { generatePrompt } from '~/utils/prompts/generatePrompt'

const prompt = defineModel<string>({ required: true })
const editing = ref(false)

function reroll() {
  prompt.value = generatePrompt()
}

onMounted(() => {
  if (!prompt.value) reroll()
})
</script>

<template>
  <div class="space-y-2">
    <div class="flex items-center gap-2">
      <button
        type="button"
        class="min-w-0 flex-1 truncate rounded-full border border-slate-200 bg-white px-4 py-2.5 text-left text-sm font-semibold text-slate-900 shadow-sm"
        @click="editing = !editing"
      >
        {{ prompt || 'Tap to set prompt' }}
      </button>
      <button
        type="button"
        class="h-11 shrink-0 rounded-full border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800"
        @click="reroll"
      >
        Reroll
      </button>
    </div>
    <input
      v-if="editing"
      v-model="prompt"
      type="text"
      class="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base"
      maxlength="120"
      placeholder="Edit prompt"
      @blur="editing = false"
    >
  </div>
</template>
