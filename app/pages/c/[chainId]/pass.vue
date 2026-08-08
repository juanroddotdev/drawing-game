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

useHead({ title: 'Pass the link — PenPass' })
</script>

<template>
  <main class="min-h-dvh bg-gradient-to-b from-slate-100 to-slate-200 px-4 py-8 text-slate-900">
    <div class="mx-auto flex max-w-lg flex-col gap-6">
      <header class="space-y-1">
        <h1 class="text-2xl font-bold tracking-tight">
          Pass it on
        </h1>
        <p class="text-sm text-slate-600">
          <span v-if="you">Nice, {{ you }}. </span>
          Send this link so someone can play {{ stepLabel }}.
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
    </div>
  </main>
</template>
