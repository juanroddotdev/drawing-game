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
            to="/c/lab"
            class="btn-quiet !px-1 !py-1"
          >
            Loop status
          </NuxtLink>
        </div>
        <h1 class="text-sm font-bold tracking-tight text-[var(--ink-muted)]">
          The reveal
        </h1>
      </header>

      <ChainRevealGallery
        class="min-h-0 flex-1"
        :reveal="reveal"
      />
    </div>
  </main>
</template>
