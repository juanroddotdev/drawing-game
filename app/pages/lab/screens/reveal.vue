<script setup lang="ts">
import { mockRevealPayload } from '~/utils/lab/fixtures'

if (!import.meta.dev) {
  await navigateTo('/')
}

/** Same chrome as `/c/:slug/reveal` — mock payload only. */
const reveal = mockRevealPayload()

useHead({ title: 'Reveal — lab' })
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
            to="/c/lab"
            class="btn-quiet !px-1 !py-1"
          >
            Loop status
          </NuxtLink>
        </div>
        <h1 class="text-2xl font-bold tracking-tight sm:text-3xl">
          The reveal
        </h1>
      </header>

      <ChainRevealGallery :reveal="reveal" />
    </div>
  </main>
</template>
