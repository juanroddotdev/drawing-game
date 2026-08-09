<script setup lang="ts">
/**
 * Design lab — open real screens with fixtures (local Nuxt only).
 * Not for production builds.
 */
if (!import.meta.dev) {
  await navigateTo('/')
}

useHead({ title: 'Screen lab — DoodleLoop' })

const passPresets = [
  { done: 1, label: 'Pass · after step 1 (first draw)', kind: 'draw' as const },
  { done: 2, label: 'Pass · after step 2 (guess)', kind: 'guess' as const },
  { done: 3, label: 'Pass · after step 3', kind: 'draw' as const },
  { done: 4, label: 'Pass · after step 4', kind: 'guess' as const },
  { done: 5, label: 'Pass · after step 5', kind: 'draw' as const },
]

function passHref(done: number, kind: 'draw' | 'guess') {
  return {
    path: '/c/lab/pass',
    query: {
      mock: '1',
      done: String(done),
      max: '6',
      step: String(done + 1),
      you: 'Juan',
      kind,
      token: 'lab-preview',
    },
  }
}
</script>

<template>
  <main class="bg-dot-grid min-h-dvh px-4 py-10 text-[var(--ink)]">
    <div class="mx-auto flex max-w-lg flex-col gap-6">
      <header class="space-y-2">
        <NuxtLink
          to="/"
          class="btn-quiet !px-0 !py-1 text-sm"
        >
          ← Home
        </NuxtLink>
        <p class="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">
          Local only
        </p>
        <h1 class="text-3xl font-bold tracking-tight">
          Screen lab
        </h1>
        <p class="text-sm leading-relaxed text-[var(--ink-muted)]">
          Jump into UI states with mock data — no chain playthrough required.
        </p>
      </header>

      <section class="space-y-3">
        <h2 class="text-sm font-bold uppercase tracking-wider text-[var(--ink-muted)]">
          Pass handoff
        </h2>
        <div class="flex flex-col gap-2">
          <NuxtLink
            v-for="preset in passPresets"
            :key="preset.done"
            :to="passHref(preset.done, preset.kind)"
            class="chip-sketch rounded-[var(--radius-chip)] px-4 py-3 text-sm font-bold text-[var(--ink)]"
          >
            {{ preset.label }}
          </NuxtLink>
        </div>
      </section>

      <section class="space-y-3">
        <h2 class="text-sm font-bold uppercase tracking-wider text-[var(--ink-muted)]">
          Reveal
        </h2>
        <NuxtLink
          to="/lab/screens/reveal"
          class="chip-sketch block rounded-[var(--radius-chip)] px-4 py-3 text-sm font-bold text-[var(--ink)]"
        >
          Full reveal · mock drawings & guesses
        </NuxtLink>
      </section>

      <section class="space-y-3">
        <h2 class="text-sm font-bold uppercase tracking-wider text-[var(--ink-muted)]">
          Also
        </h2>
        <div class="flex flex-col gap-2">
          <NuxtLink
            to="/"
            class="btn-quiet !justify-start !px-4 !py-3 text-sm"
          >
            Landing
          </NuxtLink>
          <NuxtLink
            to="/play/new"
            class="btn-quiet !justify-start !px-4 !py-3 text-sm"
          >
            Draw · start a loop
          </NuxtLink>
          <NuxtLink
            to="/lab"
            class="btn-quiet !justify-start !px-4 !py-3 text-sm"
          >
            Canvas lab
          </NuxtLink>
        </div>
      </section>
    </div>
  </main>
</template>
