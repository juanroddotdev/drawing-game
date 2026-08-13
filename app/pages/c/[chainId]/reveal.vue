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
  <main class="bg-dot-grid flex min-h-dvh flex-col px-4 text-[var(--ink)]">
    <div
      class="mx-auto flex w-full max-w-lg flex-1 flex-col gap-3"
      style="padding-top: max(0.75rem, env(safe-area-inset-top)); padding-bottom: max(0.5rem, env(safe-area-inset-bottom))"
    >
      <header class="flex shrink-0 items-center justify-between gap-3">
        <div class="flex gap-2 text-sm">
          <NuxtLink
            to="/"
            class="btn-quiet !px-1 !py-1"
          >
            Home
          </NuxtLink>
          <NuxtLink
            :to="`/c/${slug}`"
            class="btn-quiet !px-1 !py-1"
          >
            Loop status
          </NuxtLink>
        </div>
        <h1 class="text-sm font-bold tracking-tight text-[var(--ink-muted)]">
          The reveal
        </h1>
      </header>

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
