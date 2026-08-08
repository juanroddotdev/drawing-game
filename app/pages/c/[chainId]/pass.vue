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

const copied = ref(false)
const shareError = ref('')

useHead({ title: 'Pass the link — PenPass' })

async function copyLink() {
  copied.value = false
  shareError.value = ''
  try {
    await navigator.clipboard.writeText(absoluteUrl.value)
    copied.value = true
  }
  catch {
    shareError.value = 'Could not copy — select the link manually.'
  }
}

async function nativeShare() {
  shareError.value = ''
  if (!navigator.share) {
    await copyLink()
    return
  }
  try {
    await navigator.share({
      title: 'PenPass — your turn',
      text: 'Draw or guess the next step!',
      url: absoluteUrl.value,
    })
  }
  catch {
    /* user cancelled */
  }
}
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
          Send this link so someone can play step {{ step || 'next' }}.
        </p>
      </header>

      <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p class="break-all font-mono text-xs text-slate-700">
          {{ absoluteUrl || '…' }}
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
          @click="nativeShare"
        >
          Share
        </button>
        <button
          type="button"
          class="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold"
          @click="copyLink"
        >
          {{ copied ? 'Copied!' : 'Copy link' }}
        </button>
        <NuxtLink
          :to="`/c/${slug}/reveal`"
          class="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold"
        >
          Check reveal
        </NuxtLink>
      </div>

      <p
        v-if="shareError"
        class="text-sm text-red-600"
      >
        {{ shareError }}
      </p>

      <p class="text-xs text-slate-500">
        Chain <span class="font-mono">{{ slug }}</span>
        · token stays in the link (don’t post publicly forever).
      </p>
    </div>
  </main>
</template>
