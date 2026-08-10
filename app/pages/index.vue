<script setup lang="ts">
useHead({ title: 'DoodleLoop' })

/**
 * Loop line: full layout is always reserved (opacity reveal only), then
 * centered under the brand — so pieces appear in place without jumping.
 */
const beat = ref(0)
const brandPress = ref(false)
const timers: ReturnType<typeof setTimeout>[] = []

const BEAT_START_MS = 1280
const BEAT_STEP_MS = 380
const TOTAL_BEATS = 6
/** Pause after the trailing arrow before the CTA press cue */
const PRESS_AFTER_MS = 520

onMounted(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced) {
    beat.value = TOTAL_BEATS
    return
  }
  for (let i = 1; i <= TOTAL_BEATS; i++) {
    timers.push(setTimeout(() => {
      beat.value = i
      if (i === TOTAL_BEATS) {
        timers.push(setTimeout(() => {
          brandPress.value = true
        }, PRESS_AFTER_MS))
      }
    }, BEAT_START_MS + (i - 1) * BEAT_STEP_MS))
  }
})

onBeforeUnmount(() => {
  for (const t of timers) clearTimeout(t)
})
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
            class="brand-cta btn-accent pointer-events-auto !px-6 !py-4 font-sketch text-4xl font-bold leading-none tracking-tight sm:!px-8 sm:!py-5 sm:text-5xl"
            :class="{ 'brand-cta--press': brandPress }"
          >
            DoodleLoop
          </NuxtLink>

          <!-- Full width reserved from beat 0, then centered as a unit under the brand -->
          <div class="mt-4 flex w-full justify-center">
            <p
              class="pointer-events-none flex items-center gap-2 font-sketch text-xl font-bold tracking-tight text-[var(--ink)] sm:gap-2.5 sm:text-2xl"
              aria-label="Draw, pass, guess"
            >
              <span
                class="loop-reveal"
                :class="beat >= 1 ? 'loop-reveal--on' : ''"
              >Draw</span>

              <span
                class="relative inline-flex h-4 w-7 shrink-0 items-center justify-center sm:w-8"
                aria-hidden="true"
              >
                <svg
                  class="loop-reveal absolute h-3.5 w-7 sm:h-4 sm:w-8"
                  :class="beat === 2 ? 'loop-reveal--on' : ''"
                  viewBox="0 0 40 16"
                  fill="none"
                >
                  <path
                    d="M2 8 C12 3, 20 13, 28 8 L28 8"
                    stroke="currentColor"
                    stroke-width="2.25"
                    stroke-linecap="round"
                  />
                  <path
                    d="M24 4 L32 8 L24 12"
                    stroke="currentColor"
                    stroke-width="2.25"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                <svg
                  class="loop-reveal absolute h-3 w-7 sm:w-8"
                  :class="beat >= 3 ? 'loop-reveal--on' : ''"
                  viewBox="0 0 40 12"
                  fill="none"
                >
                  <path
                    d="M1 7 C10 2, 18 11, 28 5 S36 8, 39 6"
                    stroke="currentColor"
                    stroke-width="2.25"
                    stroke-linecap="round"
                  />
                </svg>
              </span>

              <span
                class="loop-reveal"
                :class="beat >= 3 ? 'loop-reveal--on' : ''"
              >Pass</span>

              <span
                class="relative inline-flex h-4 w-7 shrink-0 items-center justify-center sm:w-8"
                aria-hidden="true"
              >
                <svg
                  class="loop-reveal absolute h-3.5 w-7 sm:h-4 sm:w-8"
                  :class="beat === 4 ? 'loop-reveal--on' : ''"
                  viewBox="0 0 40 16"
                  fill="none"
                >
                  <path
                    d="M2 8 C12 3, 20 13, 28 8 L28 8"
                    stroke="currentColor"
                    stroke-width="2.25"
                    stroke-linecap="round"
                  />
                  <path
                    d="M24 4 L32 8 L24 12"
                    stroke="currentColor"
                    stroke-width="2.25"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                <svg
                  class="loop-reveal absolute h-3 w-7 sm:w-8"
                  :class="beat >= 5 ? 'loop-reveal--on' : ''"
                  viewBox="0 0 40 12"
                  fill="none"
                >
                  <path
                    d="M1 7 C10 2, 18 11, 28 5 S36 8, 39 6"
                    stroke="currentColor"
                    stroke-width="2.25"
                    stroke-linecap="round"
                  />
                </svg>
              </span>

              <span
                class="loop-reveal"
                :class="beat >= 5 ? 'loop-reveal--on' : ''"
              >Guess</span>

              <span
                class="relative inline-flex h-4 w-7 shrink-0 items-center justify-center sm:w-8"
                aria-hidden="true"
              >
                <svg
                  class="loop-reveal absolute h-3.5 w-7 sm:h-4 sm:w-8"
                  :class="beat >= 6 ? 'loop-reveal--on' : ''"
                  viewBox="0 0 40 16"
                  fill="none"
                >
                  <path
                    d="M2 8 C12 3, 20 13, 28 8 L28 8"
                    stroke="currentColor"
                    stroke-width="2.25"
                    stroke-linecap="round"
                  />
                  <path
                    d="M24 4 L32 8 L24 12"
                    stroke="currentColor"
                    stroke-width="2.25"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </span>
            </p>
          </div>
        </div>
      </section>

      <div class="mt-auto pt-10">
        <LayoutAppFooter />
      </div>
    </div>
  </main>
</template>

<style scoped>
.brand-cta {
  opacity: 0;
  /* forwards (not both): stay fully hidden during the delay, then pop */
  animation: brand-cta-pop 0.48s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  animation-delay: 1.05s;
}

.brand-cta--press {
  opacity: 1;
  animation: brand-cta-press 0.52s cubic-bezier(0.22, 1, 0.36, 1);
}

.loop-reveal {
  opacity: 0;
  transition: opacity 0.28s ease;
}

.loop-reveal--on {
  opacity: 1;
}

@keyframes brand-cta-pop {
  from {
    transform: scale(0.82);
    opacity: 0;
  }
  70% {
    transform: scale(1.05);
    opacity: 1;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

/* Neo-brutal press: sink into the hard shadow, then release */
@keyframes brand-cta-press {
  0% {
    transform: translate(0, 0);
    box-shadow: var(--shadow-offset) var(--shadow-offset) 0 var(--ink);
  }
  35% {
    transform: translate(var(--shadow-offset), var(--shadow-offset));
    box-shadow: 0 0 0 0 var(--ink);
  }
  100% {
    transform: translate(0, 0);
    box-shadow: var(--shadow-offset) var(--shadow-offset) 0 var(--ink);
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
  .brand-cta,
  .brand-cta--press,
  :deep(.landing-hero__strip) {
    opacity: 1;
    transform: none;
    animation: none;
  }

  .loop-reveal {
    transition: none;
  }

  :deep(.landing-hero__strip) {
    opacity: 0.28;
  }
}
</style>
