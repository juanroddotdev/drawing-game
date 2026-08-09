<script setup lang="ts">
useHead({ title: 'DoodleLoop' })

/**
 * Loop line choreography (mirrors pass path):
 * word writes letter-by-letter → connector draws in → prior arrow
 * settles to a drawn line → … trailing arrow after Guess.
 * Builds left → right in place so Draw never jumps.
 */
const beat = ref(0)
const timers: ReturnType<typeof setTimeout>[] = []

const BEAT_START_MS = 1280
/** Enough room for a short word to write before the next beat */
const BEAT_STEP_MS = 420
const TOTAL_BEATS = 6

const DRAW = 'Draw'.split('')
const PASS = 'Pass'.split('')
const GUESS = 'Guess'.split('')

onMounted(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced) {
    beat.value = TOTAL_BEATS
    return
  }
  for (let i = 1; i <= TOTAL_BEATS; i++) {
    timers.push(setTimeout(() => {
      beat.value = i
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
            class="hero-line hero-line-1 brand-cta btn-accent pointer-events-auto !px-6 !py-4 font-sketch text-4xl font-bold leading-none tracking-tight sm:!px-8 sm:!py-5 sm:text-5xl"
          >
            DoodleLoop
          </NuxtLink>

          <!-- Build LTR from the left so Draw never jumps -->
          <div class="mt-4 w-full min-h-[1.75rem] sm:min-h-[2rem]">
            <p
              class="pointer-events-none inline-flex items-center gap-2 text-left font-sketch text-xl font-bold tracking-tight text-[var(--ink)] sm:gap-2.5 sm:text-2xl"
              aria-label="Draw, pass, guess"
            >
              <span
                v-if="beat >= 1"
                class="loop-word"
                aria-hidden="true"
              >
                <span
                  v-for="(ch, i) in DRAW"
                  :key="`d-${i}`"
                  class="loop-ch"
                  :style="{ '--i': i }"
                >{{ ch }}</span>
              </span>

              <svg
                v-if="beat === 2"
                class="h-3.5 w-7 shrink-0 sm:h-4 sm:w-8"
                viewBox="0 0 40 16"
                fill="none"
                aria-hidden="true"
              >
                <path
                  class="loop-draw loop-draw--shaft"
                  d="M2 8 C12 3, 20 13, 28 8 L28 8"
                  stroke="currentColor"
                  stroke-width="2.25"
                  stroke-linecap="round"
                />
                <path
                  class="loop-draw loop-draw--head"
                  d="M24 4 L32 8 L24 12"
                  stroke="currentColor"
                  stroke-width="2.25"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <svg
                v-else-if="beat >= 3"
                class="h-3 w-7 shrink-0 sm:w-8"
                viewBox="0 0 40 12"
                fill="none"
                aria-hidden="true"
              >
                <path
                  class="loop-draw loop-draw--line"
                  d="M1 7 C10 2, 18 11, 28 5 S36 8, 39 6"
                  stroke="currentColor"
                  stroke-width="2.25"
                  stroke-linecap="round"
                />
              </svg>

              <span
                v-if="beat >= 3"
                class="loop-word"
                aria-hidden="true"
              >
                <span
                  v-for="(ch, i) in PASS"
                  :key="`p-${i}`"
                  class="loop-ch"
                  :style="{ '--i': i }"
                >{{ ch }}</span>
              </span>

              <svg
                v-if="beat === 4"
                class="h-3.5 w-7 shrink-0 sm:h-4 sm:w-8"
                viewBox="0 0 40 16"
                fill="none"
                aria-hidden="true"
              >
                <path
                  class="loop-draw loop-draw--shaft"
                  d="M2 8 C12 3, 20 13, 28 8 L28 8"
                  stroke="currentColor"
                  stroke-width="2.25"
                  stroke-linecap="round"
                />
                <path
                  class="loop-draw loop-draw--head"
                  d="M24 4 L32 8 L24 12"
                  stroke="currentColor"
                  stroke-width="2.25"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <svg
                v-else-if="beat >= 5"
                class="h-3 w-7 shrink-0 sm:w-8"
                viewBox="0 0 40 12"
                fill="none"
                aria-hidden="true"
              >
                <path
                  class="loop-draw loop-draw--line"
                  d="M1 7 C10 2, 18 11, 28 5 S36 8, 39 6"
                  stroke="currentColor"
                  stroke-width="2.25"
                  stroke-linecap="round"
                />
              </svg>

              <span
                v-if="beat >= 5"
                class="loop-word"
                aria-hidden="true"
              >
                <span
                  v-for="(ch, i) in GUESS"
                  :key="`g-${i}`"
                  class="loop-ch"
                  :style="{ '--i': i }"
                >{{ ch }}</span>
              </span>

              <svg
                v-if="beat >= 6"
                class="h-3.5 w-7 shrink-0 sm:h-4 sm:w-8"
                viewBox="0 0 40 16"
                fill="none"
                aria-hidden="true"
              >
                <path
                  class="loop-draw loop-draw--shaft"
                  d="M2 8 C12 3, 20 13, 28 8 L28 8"
                  stroke="currentColor"
                  stroke-width="2.25"
                  stroke-linecap="round"
                />
                <path
                  class="loop-draw loop-draw--head"
                  d="M24 4 L32 8 L24 12"
                  stroke="currentColor"
                  stroke-width="2.25"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
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
.hero-line {
  opacity: 0;
  transform: translateY(0.55rem);
  animation: hero-in 0.55s ease forwards;
}

.hero-line-1 {
  animation-delay: 1.05s;
}

.loop-word {
  display: inline-flex;
  line-height: 1;
}

.loop-ch {
  display: inline-block;
  opacity: 0;
  clip-path: inset(0 100% 0 0);
  transform: translateY(0.1em);
  animation: loop-write 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
  animation-delay: calc(var(--i) * 0.05s);
}

.loop-draw {
  fill: none;
}

.loop-draw--shaft {
  stroke-dasharray: 42;
  stroke-dashoffset: 42;
  animation: loop-stroke 0.34s ease forwards;
}

.loop-draw--head {
  stroke-dasharray: 28;
  stroke-dashoffset: 28;
  animation: loop-stroke 0.22s ease 0.14s forwards;
}

.loop-draw--line {
  stroke-dasharray: 52;
  stroke-dashoffset: 52;
  animation: loop-stroke 0.38s ease forwards;
}

@keyframes hero-in {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes loop-write {
  to {
    opacity: 1;
    clip-path: inset(0 0 0 0);
    transform: translateY(0);
  }
}

@keyframes loop-stroke {
  to {
    stroke-dashoffset: 0;
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
  .loop-ch,
  .loop-draw--shaft,
  .loop-draw--head,
  .loop-draw--line,
  :deep(.landing-hero__strip) {
    opacity: 1;
    transform: none;
    animation: none;
    clip-path: none;
    stroke-dashoffset: 0;
  }

  :deep(.landing-hero__strip) {
    opacity: 0.28;
  }
}
</style>
