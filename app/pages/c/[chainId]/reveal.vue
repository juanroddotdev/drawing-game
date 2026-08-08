<script setup lang="ts">
import type { RevealPayload } from '~/types/chain'

const route = useRoute()
const api = useChainApi()
const slug = computed(() => String(route.params.chainId || ''))

const reveal = ref<RevealPayload | null>(null)
const error = ref('')

useHead({ title: computed(() => `Reveal — ${slug.value}`) })

async function load() {
  error.value = ''
  try {
    reveal.value = await api.getReveal(slug.value)
  }
  catch (e) {
    error.value = e instanceof Error ? e.message : 'Reveal unavailable'
    reveal.value = null
  }
}

onMounted(load)
</script>

<template>
  <main class="min-h-dvh bg-gradient-to-b from-slate-100 to-slate-200 px-4 py-8 text-slate-900">
    <div class="mx-auto flex max-w-2xl flex-col gap-6">
      <header class="space-y-1">
        <NuxtLink
          to="/"
          class="text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          ← Home
        </NuxtLink>
        <h1 class="text-2xl font-bold tracking-tight">
          Reveal
        </h1>
      </header>

      <p
        v-if="error"
        class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
      >
        {{ error }}
        <span class="block text-amber-800/80">
          The full gallery unlocks when the chain is complete.
        </span>
      </p>

      <template v-else-if="reveal">
        <div class="rounded-xl border border-slate-200 bg-white p-4">
          <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Original prompt
          </p>
          <p class="text-lg font-medium">
            {{ reveal.prompt_text }}
          </p>
          <p class="mt-1 text-sm text-slate-500">
            by {{ reveal.creator_nickname }}
          </p>
        </div>

        <ol class="space-y-4">
          <li
            v-for="step in reveal.steps"
            :key="step.step_number"
            class="rounded-xl border border-slate-200 bg-white p-4"
          >
            <p class="text-sm font-semibold text-slate-700">
              Step {{ step.step_number }}
              · {{ step.type }}
              <span
                v-if="step.author_nickname"
                class="font-normal text-slate-500"
              >— {{ step.author_nickname }}</span>
            </p>
            <CanvasStrokeRenderer
              v-if="step.type === 'draw' && step.stroke_json"
              class="mt-3"
              :document="step.stroke_json"
            />
            <p
              v-else-if="step.guess_text"
              class="mt-2 text-base"
            >
              “{{ step.guess_text }}”
            </p>
          </li>
        </ol>
      </template>

      <p
        v-else
        class="text-sm text-slate-500"
      >
        Loading…
      </p>
    </div>
  </main>
</template>
