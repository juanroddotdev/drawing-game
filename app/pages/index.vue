<script setup lang="ts">
useHead({ title: 'DoodleLoop' })
</script>

<template>
  <main class="bg-dot-grid relative min-h-dvh overflow-hidden text-[var(--ink)]">
    <div class="relative mx-auto flex min-h-dvh max-w-lg flex-col px-4 pb-10 pt-8">
      <!-- One composition: messenger strip under centered brand -->
      <section
        class="landing-hero relative mx-auto w-full max-w-sm flex-1"
        aria-label="DoodleLoop"
      >
        <MarketingChaosPreview class="landing-hero__strip" />

        <header class="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center px-3 text-center">
          <h1 class="hero-line hero-line-1 font-sketch text-5xl font-bold leading-none tracking-tight text-[var(--ink)] sm:text-6xl">
            DoodleLoop
          </h1>
          <p class="hero-line hero-line-2 mt-3 text-2xl font-bold tracking-tight text-[var(--ink)] sm:text-3xl">
            Draw. Pass. Guess.
            <span class="text-[var(--accent-deep)]">Repeat.</span>
          </p>
        </header>
      </section>

      <div class="hero-line hero-line-3 relative z-10 mt-8 flex justify-center">
        <NuxtLink
          to="/play/new"
          class="btn-ink pointer-events-auto w-full sm:w-auto sm:min-w-[12rem]"
        >
          Start a loop
        </NuxtLink>
      </div>

      <div class="mt-auto pt-10">
        <LayoutAppFooter />
      </div>
    </div>
  </main>
</template>

<style scoped>
/* Beats finish ~0.9s; brand lines follow */
.hero-line {
  opacity: 0;
  transform: translateY(0.55rem);
  animation: hero-in 0.55s ease forwards;
}

.hero-line-1 {
  animation-delay: 1.05s;
}

.hero-line-2 {
  animation-delay: 1.28s;
}

.hero-line-3 {
  animation-delay: 1.5s;
}

@keyframes hero-in {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

:deep(.landing-hero__strip) {
  animation: strip-settle 0.55s ease forwards;
  animation-delay: 1.05s;
}

@keyframes strip-settle {
  to {
    opacity: 0.28;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-line,
  :deep(.landing-hero__strip) {
    opacity: 1;
    transform: none;
    animation: none;
  }

  :deep(.landing-hero__strip) {
    opacity: 0.28;
  }
}
</style>
