<script setup lang="ts">
/**
 * Design lab — ordered slideshow of main screens (local Nuxt only).
 */
import {
  LAB_FORM_FACTORS,
  LAB_TOUR_SLIDES,
  labFrameTo,
  type LabFormFactor,
} from '~/utils/lab/tour'

if (!import.meta.dev) {
  await navigateTo('/')
}

useHead({ title: 'Screen lab — DoodleLoop' })

const formFactor = ref<LabFormFactor>('mobile')

function slideTo(id: string) {
  return labFrameTo(id, formFactor.value)
}
</script>

<template>
  <main class="bg-dot-grid min-h-dvh px-4 py-10 text-[var(--ink)]">
    <div class="mx-auto flex max-w-lg flex-col gap-8 pb-16">
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
          Screen tour
        </h1>
        <p class="text-sm leading-relaxed text-[var(--ink-muted)]">
          Flip through the main UI in a device frame — mobile, tablet, or desktop —
          so breakpoints match what players actually see.
        </p>
      </header>

      <div class="space-y-2">
        <p class="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">
          Form factor
        </p>
        <div
          class="flex gap-2"
          role="group"
          aria-label="Default form factor"
        >
          <button
            v-for="ff in LAB_FORM_FACTORS"
            :key="ff.id"
            type="button"
            class="chip-sketch flex-1 rounded-[var(--radius-chip)] px-3 py-2.5 text-sm font-bold"
            :class="formFactor === ff.id
              ? 'bg-[var(--accent)] text-[var(--ink)]'
              : 'text-[var(--ink)]'"
            :aria-pressed="formFactor === ff.id"
            @click="formFactor = ff.id"
          >
            {{ ff.label }}
            <span class="mt-0.5 block text-[10px] font-bold text-[var(--ink-muted)]">
              {{ ff.width }}×{{ ff.height }}
            </span>
          </button>
        </div>
      </div>

      <NuxtLink
        :to="slideTo(LAB_TOUR_SLIDES[0]!.id)"
        class="btn-accent inline-flex w-full items-center justify-center !px-5 !py-4 text-base font-bold"
      >
        Start slideshow
      </NuxtLink>

      <ol class="flex flex-col gap-2">
        <li
          v-for="(slide, i) in LAB_TOUR_SLIDES"
          :key="slide.id"
        >
          <NuxtLink
            :to="slideTo(slide.id)"
            class="chip-sketch flex gap-3 rounded-[var(--radius-chip)] px-4 py-3 text-left text-[var(--ink)]"
          >
            <span class="w-6 shrink-0 text-sm font-bold text-[var(--ink-muted)]">
              {{ i + 1 }}
            </span>
            <span class="min-w-0">
              <span class="block text-sm font-bold leading-snug">
                {{ slide.title }}
              </span>
              <span class="mt-0.5 block text-xs leading-snug text-[var(--ink-muted)]">
                {{ slide.blurb }}
              </span>
            </span>
          </NuxtLink>
        </li>
      </ol>

      <p class="text-xs leading-relaxed text-[var(--ink-muted)]">
        Draw · start vs Draw · step 3 are different shells (editable prompt vs locked guess).
        Guess · step 2 and Guess · step 4 share one shell — both are listed so you can compare content.
        Frames use an iframe so <code class="font-bold">sm:</code> breakpoints follow the device width.
      </p>
    </div>
  </main>
</template>
