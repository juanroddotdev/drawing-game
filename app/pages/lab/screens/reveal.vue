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
  <main class="bg-dot-grid flex min-h-dvh flex-col px-4 text-[var(--ink)]">
    <h1 class="sr-only">
      The reveal
    </h1>
    <div
      class="mx-auto flex w-full max-w-lg flex-1 flex-col"
      style="padding-top: max(0.75rem, env(safe-area-inset-top)); padding-bottom: max(0.5rem, env(safe-area-inset-bottom))"
    >
      <ChainRevealGallery
        class="min-h-0 flex-1"
        :reveal="reveal"
      />
    </div>
  </main>
</template>
