<script setup lang="ts">
import { sharePath } from '~/types/chain'

const route = useRoute()
const slug = computed(() => String(route.params.chainId || ''))
const token = computed(() => String(route.query.token || ''))
const step = computed(() => String(route.query.step || ''))
const you = computed(() => String(route.query.you || ''))

const absoluteUrl = computed(() => {
  if (!import.meta.client) return ''
  return `${window.location.origin}${sharePath(slug.value, token.value)}`
})

const stepLabel = computed(() => `step ${step.value || 'next'}`)
const { enabled: showDevTools } = useDevTools()

useHead({ title: 'Pass the link — DoodleLoop' })
</script>

<template>
  <main class="min-h-dvh bg-gradient-to-b from-slate-100 to-slate-200 px-4 py-8 text-slate-900">
    <div class="mx-auto flex max-w-lg flex-col gap-5">
      <header class="space-y-1">
        <h1 class="text-xl font-bold tracking-tight">
          Pass it on
        </h1>
        <p class="text-sm text-slate-600">
          <span v-if="you">Nice, {{ you }}. </span>
          Share so someone can play {{ stepLabel }}.
        </p>
      </header>

      <ChainShareTurn
        :url="absoluteUrl"
        :step-label="stepLabel"
        :slug="slug"
      />

      <p class="text-xs text-slate-500">
        Chain <span class="font-mono">{{ slug }}</span>
      </p>

      <div
        v-if="showDevTools"
        class="flex flex-wrap gap-2 rounded-xl border border-dashed border-slate-400/80 bg-white/50 p-3"
      >
        <NuxtLink
          v-if="token"
          :to="`/c/${slug}/play?token=${encodeURIComponent(token)}`"
          class="rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-slate-950"
        >
          Play next step myself
        </NuxtLink>
        <NuxtLink
          :to="`/c/${slug}/dev`"
          class="rounded-xl border border-dashed border-slate-400 bg-white/70 px-4 py-3 text-sm font-semibold text-slate-700"
        >
          Dev inspector
        </NuxtLink>
      </div>
    </div>
  </main>
</template>
