<script setup lang="ts">
import type { RevealPayload } from '~/types/chain'

const route = useRoute()
const api = useChainApi()
const slug = computed(() => String(route.params.chainId || ''))

const reveal = ref<RevealPayload | null>(null)
const error = ref('')

useHead({ title: computed(() => `Reveal — ${slug.value}`) })

async function load() {
  error.value = ''
  try {
    reveal.value = await api.getReveal(slug.value)
  }
  catch (e) {
    error.value = e instanceof Error ? e.message : 'Reveal unavailable'
    reveal.value = null
  }
}

onMounted(load)
</script>

<template>
  <main class="bg-dot-grid flex min-h-dvh flex-col px-2 text-[var(--ink)] sm:px-3">
    <h1 class="sr-only">
      The reveal
    </h1>
    <div
      class="mx-auto flex w-full max-w-none flex-1 flex-col"
      style="padding-top: max(0.5rem, env(safe-area-inset-top)); padding-bottom: max(0.25rem, env(safe-area-inset-bottom))"
    >
      <p
        v-if="error"
        class="border border-[var(--ink)] bg-[var(--toast-alert)] px-3 py-2 text-sm font-semibold text-[var(--ink)] shadow-block"
      >
        {{ error }}
        <span class="mt-1 block font-medium text-[var(--ink-muted)]">
          The full gallery unlocks when the loop is complete.
        </span>
      </p>

      <ChainRevealGallery
        v-else-if="reveal"
        class="min-h-0 flex-1"
        :reveal="reveal"
      />

      <p
        v-else
        class="text-center text-sm text-[var(--ink-muted)]"
      >
        Loading…
      </p>
    </div>
  </main>
</template>
