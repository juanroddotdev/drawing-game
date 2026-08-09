<script setup lang="ts">
useHead({ title: 'DoodleLoop' })
</script>

<template>
  <main class="bg-dot-grid relative min-h-dvh overflow-hidden text-[var(--ink)]">
    <div class="relative mx-auto flex min-h-dvh max-w-lg flex-col px-4 pb-10 pt-14">
      <header class="space-y-4">
        <h1 class="font-sketch text-5xl font-bold leading-none tracking-tight text-[var(--ink)] sm:text-6xl">
          DoodleLoop
        </h1>
        <p class="text-2xl font-bold tracking-tight text-[var(--ink)] sm:text-3xl">
          Draw. Pass. Guess.
          <span class="text-[var(--accent-deep)]">Repeat.</span>
        </p>
        <p class="max-w-md text-base leading-relaxed text-[var(--ink-muted)]">
          Async telephone with friends — draw, share a link, pass the turn, reveal the chaos.
        </p>
      </header>

      <div class="mt-8">
        <NuxtLink
          to="/play/new"
          class="btn-ink w-full sm:w-auto sm:min-w-[12rem]"
        >
          Start a loop
        </NuxtLink>
      </div>

      <div class="mt-10">
        <MarketingChaosPreview />
      </div>

      <div class="mt-auto pt-12">
        <LayoutAppFooter />
      </div>
    </div>
  </main>
</template>
