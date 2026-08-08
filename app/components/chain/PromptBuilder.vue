<script setup lang="ts">
const prompt = defineModel<string>({ required: true })

function reroll() {
  prompt.value = generatePrompt()
}

onMounted(() => {
  if (!prompt.value) reroll()
})
</script>

<template>
  <div class="space-y-2">
    <label class="block text-sm font-medium text-slate-700">
      Prompt
    </label>
    <div class="flex gap-2">
      <input
        v-model="prompt"
        type="text"
        class="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        maxlength="120"
      >
      <button
        type="button"
        class="shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium"
        @click="reroll"
      >
        Reroll
      </button>
    </div>
    <p class="text-xs text-slate-500">
      Combo prompt — edit freely before you draw.
    </p>
  </div>
</template>
