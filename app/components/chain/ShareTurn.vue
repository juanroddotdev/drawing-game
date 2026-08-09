<script setup lang="ts">
defineProps<{
  url: string
  stepLabel: string
}>()

const { copied, shareError, copyText, shareOrCopy } = useShareLink()
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-stretch gap-2">
      <button
        type="button"
        class="btn-accent min-w-0 flex-[1.65] !px-4 !py-4 text-sm sm:text-base"
        @click="shareOrCopy({ title: 'DoodleLoop — your turn', text: `You're up for ${stepLabel}`, url })"
      >
        Share turn
      </button>
      <button
        type="button"
        class="chip-sketch flex shrink-0 items-center justify-center rounded-[var(--radius-chip)] px-4 text-sm font-bold text-[var(--ink)] sm:min-w-[5.5rem]"
        aria-label="Copy full link"
        @click="copyText(url)"
      >
        {{ copied ? 'Copied' : 'Copy' }}
      </button>
    </div>

    <p
      v-if="shareError"
      class="text-sm text-[var(--danger)]"
    >
      {{ shareError }}
    </p>

    <p class="text-center text-xs text-[var(--ink-muted)]">
      Anyone with this link can take the next seat. Don’t post it publicly forever.
    </p>
  </div>
</template>
