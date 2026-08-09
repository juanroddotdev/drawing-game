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
    <div class="mx-auto flex max-w-lg flex-col gap-5 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <header class="space-y-1 text-center">
        <NuxtLink
          to="/lab/screens"
          class="btn-quiet !px-1 !py-1 text-sm"
        >
          ← Screen lab
        </NuxtLink>
        <p class="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">
          Mock data · local only
        </p>
        <h1 class="text-2xl font-bold tracking-tight sm:text-3xl">
          The reveal
        </h1>
      </header>

      <ChainRevealGallery :reveal="reveal" />
    </div>
  </main>
</template>
