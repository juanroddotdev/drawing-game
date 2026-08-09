<script setup lang="ts">
useHead({ title: 'DoodleLoop' })
</script>

<template>
  <main class="bg-dot-grid relative min-h-dvh overflow-hidden text-[var(--ink)]">
    <div class="relative mx-auto flex min-h-dvh max-w-lg flex-col px-4 pb-10 pt-8">
      <!-- One composition: messenger strip under centered brand CTA -->
      <section
        class="landing-hero relative mx-auto w-full max-w-sm flex-1"
        aria-label="DoodleLoop"
      >
        <MarketingChaosPreview class="landing-hero__strip" />

        <div class="absolute inset-0 z-10 flex flex-col items-center justify-center px-3 text-center">
          <h1 class="sr-only">
            DoodleLoop
          </h1>
          <NuxtLink
            to="/play/new"
            class="hero-line hero-line-1 brand-cta btn-accent pointer-events-auto !px-6 !py-4 font-sketch text-4xl font-bold leading-none tracking-tight sm:!px-8 sm:!py-5 sm:text-5xl"
          >
            DoodleLoop
          </NuxtLink>
          <p class="hero-line hero-line-2 pointer-events-none mt-4 text-xl font-bold tracking-tight text-[var(--ink)] sm:text-2xl">
            Draw. Pass. Guess.
            <span class="text-[var(--accent-deep)]">Repeat.</span>
          </p>
        </div>
      </section>

      <div class="mt-auto pt-10">
        <LayoutAppFooter />
      </div>
    </div>
  </main>
</template>

<style scoped>
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
