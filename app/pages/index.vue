<script setup lang="ts">
useHead({ title: 'DoodleLoop' })
</script>

<template>
  <main class="relative min-h-dvh overflow-hidden text-slate-900">
    <!-- Soft paper atmosphere + ink speckles -->
    <div
      class="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,#f8fafc,transparent_55%),linear-gradient(180deg,#e2e8f0_0%,#f1f5f9_45%,#e8eef5_100%)]"
      aria-hidden="true"
    />
    <div
      class="pointer-events-none absolute -right-16 top-24 h-56 w-56 rounded-full bg-[#d9f99d]/50 blur-3xl"
      aria-hidden="true"
    />
    <div
      class="pointer-events-none absolute -left-20 bottom-32 h-48 w-48 rounded-full bg-slate-300/40 blur-3xl"
      aria-hidden="true"
    />

    <div class="mx-auto flex min-h-dvh max-w-lg flex-col px-4 pb-10 pt-14">
      <header class="space-y-4">
        <h1 class="text-5xl font-black tracking-tight text-slate-950 sm:text-6xl">
          DoodleLoop
        </h1>
        <p class="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
          Draw. Pass. Guess.
          <span class="text-[#65a30d]">Repeat.</span>
        </p>
        <p class="max-w-md text-base leading-relaxed text-slate-600">
          Async telephone with friends — draw, share a link, pass the turn, reveal the chaos.
        </p>
      </header>

      <div class="mt-8">
        <NuxtLink
          to="/play/new"
          class="inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-5 py-4 text-base font-semibold text-white shadow-sm transition hover:bg-slate-800 sm:w-auto sm:min-w-[12rem]"
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
