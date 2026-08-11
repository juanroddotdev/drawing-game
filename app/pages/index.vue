<script setup lang="ts">
useHead({ title: 'DoodleLoop' })

/**
 * Loop line: layout reserved from the start. An arrow tip draws through
 * each connector; words pop in as it arrives. Finished connectors keep
 * the trail and drop the tip so it feels like one continuous pass.
 */
const beat = ref(0)
const brandPress = ref(false)
const timers: ReturnType<typeof setTimeout>[] = []

/** Brand CTA appears at 1.05s — subtitle starts with it */
const BEAT_START_MS = 1050
/** Time between word / connector advances */
const BEAT_STEP_MS = 200
const TOTAL_BEATS = 6
/** Pause after the trailing arrow before the CTA press cue */
const PRESS_AFTER_MS = 360

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

/** Connector phase: idle | drawing (tip leading) | done (trail only) */
function connectorPhase(drawBeat: number, doneBeat: number): 'idle' | 'drawing' | 'done' {
  if (beat.value >= doneBeat) return 'done'
  if (beat.value >= drawBeat) return 'drawing'
  return 'idle'
}
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
                class="loop-word"
                :class="beat >= 1 ? 'loop-word--on' : ''"
              >Draw</span>

              <span
                class="loop-connector"
                :class="`loop-connector--${connectorPhase(2, 3)}`"
                aria-hidden="true"
              >
                <svg
                  class="h-3.5 w-7 sm:h-4 sm:w-8"
                  viewBox="0 0 40 16"
                  fill="none"
                >
                  <path
                    class="loop-trail"
                    pathLength="1"
                    d="M2 8 C12 3, 20 13, 30 8"
                    stroke="currentColor"
                    stroke-width="2.25"
                    stroke-linecap="round"
                  />
                  <path
                    class="loop-tip"
                    d="M26 4 L34 8 L26 12"
                    stroke="currentColor"
                    stroke-width="2.25"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </span>

              <span
                class="loop-word"
                :class="beat >= 3 ? 'loop-word--on' : ''"
              >Pass</span>

              <span
                class="loop-connector"
                :class="`loop-connector--${connectorPhase(4, 5)}`"
                aria-hidden="true"
              >
                <svg
                  class="h-3.5 w-7 sm:h-4 sm:w-8"
                  viewBox="0 0 40 16"
                  fill="none"
                >
                  <path
                    class="loop-trail"
                    pathLength="1"
                    d="M2 8 C12 3, 20 13, 30 8"
                    stroke="currentColor"
                    stroke-width="2.25"
                    stroke-linecap="round"
                  />
                  <path
                    class="loop-tip"
                    d="M26 4 L34 8 L26 12"
                    stroke="currentColor"
                    stroke-width="2.25"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </span>

              <span
                class="loop-word"
                :class="beat >= 5 ? 'loop-word--on' : ''"
              >Guess</span>

              <span
                class="loop-connector"
                :class="`loop-connector--${connectorPhase(6, 7)}`"
                aria-hidden="true"
              >
                <svg
                  class="h-3.5 w-7 sm:h-4 sm:w-8"
                  viewBox="0 0 40 16"
                  fill="none"
                >
                  <path
                    class="loop-trail"
                    pathLength="1"
                    d="M2 8 C12 3, 20 13, 30 8"
                    stroke="currentColor"
                    stroke-width="2.25"
                    stroke-linecap="round"
                  />
                  <path
                    class="loop-tip"
                    d="M26 4 L34 8 L26 12"
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

.loop-word {
  opacity: 0;
  transform: translateX(-0.35em) scale(0.92);
}

.loop-word--on {
  animation: loop-word-in 0.28s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.loop-connector {
  display: inline-flex;
  height: 1rem;
  width: 1.75rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
}

@media (min-width: 640px) {
  .loop-connector {
    width: 2rem;
  }
}

.loop-trail {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
}

.loop-tip {
  opacity: 0;
}

.loop-connector--drawing .loop-trail {
  animation: loop-trail-draw 0.2s cubic-bezier(0.33, 1, 0.68, 1) forwards;
}

.loop-connector--done .loop-trail {
  stroke-dashoffset: 0;
}

.loop-connector--drawing .loop-tip {
  animation: loop-tip-in 0.14s ease-out 0.08s forwards;
}

.loop-connector--done .loop-tip {
  opacity: 0;
  animation: none;
  transition: opacity 0.12s ease;
}

@keyframes loop-word-in {
  from {
    opacity: 0;
    transform: translateX(-0.35em) scale(0.92);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

@keyframes loop-trail-draw {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes loop-tip-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
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

  .loop-word,
  .loop-word--on {
    opacity: 1;
    transform: none;
    animation: none;
  }

  .loop-trail {
    stroke-dashoffset: 0;
    animation: none;
  }

  .loop-tip {
    opacity: 1;
    animation: none;
    transition: none;
  }

  .loop-connector--done .loop-tip {
    opacity: 0;
  }

  :deep(.landing-hero__strip) {
    opacity: 0.28;
  }
}
</style>
