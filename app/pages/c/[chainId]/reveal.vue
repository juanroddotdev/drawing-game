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
  <main class="min-h-dvh bg-gradient-to-b from-slate-100 to-slate-200 px-4 py-8 text-slate-900">
    <div class="mx-auto flex max-w-2xl flex-col gap-6">
      <header class="space-y-1">
        <div class="flex flex-wrap gap-3 text-sm font-medium text-slate-500">
          <NuxtLink
            to="/"
            class="hover:text-slate-800"
          >
            ← Home
          </NuxtLink>
          <NuxtLink
            :to="`/c/${slug}`"
            class="hover:text-slate-800"
          >
            Chain status
          </NuxtLink>
        </div>
        <h1 class="text-2xl font-bold tracking-tight">
          The reveal
        </h1>
        <p class="text-sm text-slate-600">
          Step through the telephone — drawings replay stroke by stroke.
        </p>
      </header>

      <p
        v-if="error"
        class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
      >
        {{ error }}
        <span class="block text-amber-800/80">
          The full gallery unlocks when the chain is complete.
        </span>
      </p>

      <ChainRevealGallery
        v-else-if="reveal"
        :reveal="reveal"
      />

      <p
        v-else
        class="text-sm text-slate-500"
      >
        Loading…
      </p>
    </div>
  </main>
</template>
