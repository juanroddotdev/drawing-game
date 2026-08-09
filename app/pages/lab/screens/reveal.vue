<script setup lang="ts">
import { mockRevealPayload } from '~/utils/lab/fixtures'

if (!import.meta.dev) {
  await navigateTo('/')
}

const reveal = mockRevealPayload()

useHead({ title: 'Reveal lab — DoodleLoop' })
</script>

<template>
  <main class="bg-dot-grid min-h-dvh px-4 py-8 text-[var(--ink)]">
    <div class="mx-auto flex max-w-2xl flex-col gap-6">
      <header class="space-y-1">
        <div class="flex flex-wrap gap-3 text-sm font-medium">
          <NuxtLink
            to="/lab/screens"
            class="btn-quiet !px-0 !py-1"
          >
            ← Screen lab
          </NuxtLink>
        </div>
        <p class="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">
          Mock data · local only
        </p>
        <h1 class="text-2xl font-bold tracking-tight">
          The reveal
        </h1>
        <p class="text-sm text-[var(--ink-muted)]">
          Fixture chain — drawings + wrong guesses, no API.
        </p>
      </header>

      <ChainRevealGallery :reveal="reveal" />
    </div>
  </main>
</template>
