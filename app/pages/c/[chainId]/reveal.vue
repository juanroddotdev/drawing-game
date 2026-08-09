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
  <main class="bg-dot-grid min-h-dvh px-4 py-8 text-[var(--ink)]">
    <div class="mx-auto flex max-w-lg flex-col gap-5 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <header class="space-y-1 text-center">
        <div class="flex justify-center gap-3 text-sm">
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
        <h1 class="text-2xl font-bold tracking-tight sm:text-3xl">
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
