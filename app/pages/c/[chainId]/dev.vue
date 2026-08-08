<script setup lang="ts">
import type { ChainInspectorPayload } from '~/types/chain'

const route = useRoute()
const config = useRuntimeConfig()
const api = useChainApi()
const { enabled: showDevTools } = useDevTools()

const slug = computed(() => String(route.params.chainId || ''))

if (!showDevTools.value) {
  await navigateTo(`/c/${slug.value}`)
}

const data = ref<ChainInspectorPayload | null>(null)
const error = ref('')
const busy = ref(false)

useHead({ title: computed(() => `Dev inspector — ${slug.value}`) })

async function load() {
  error.value = ''
  if (!showDevTools.value) {
    error.value = 'Dev inspector is only available in local development.'
    return
  }
  try {
    data.value = await api.getChainInspector(slug.value)
  }
  catch (e) {
    error.value = e instanceof Error ? e.message : 'Inspector failed'
    data.value = null
  }
}

async function playNext() {
  busy.value = true
  error.value = ''
  try {
    const link = await api.devMintPlayLink(slug.value)
    await navigateTo({
      path: `/c/${slug.value}/play`,
      query: { token: link.claim_token },
    })
  }
  catch (e) {
    error.value = e instanceof Error ? e.message : 'Could not mint play link'
  }
  finally {
    busy.value = false
  }
}

onMounted(load)
</script>

<template>
  <main class="min-h-dvh bg-slate-950 px-4 py-8 text-slate-100">
    <div class="mx-auto flex max-w-3xl flex-col gap-6">
      <header class="space-y-2">
        <p class="text-xs font-semibold uppercase tracking-wide text-amber-400">
          Dev inspector
        </p>
        <h1 class="text-2xl font-bold tracking-tight">
          {{ slug }}
        </h1>
        <p class="text-sm text-slate-400">
          Full chain dump for solo testing. Not a player-facing screen.
        </p>
        <div class="flex flex-wrap gap-2 pt-1">
          <NuxtLink
            :to="`/c/${slug}`"
            class="rounded-lg border border-slate-700 px-3 py-1.5 text-sm"
          >
            Status
          </NuxtLink>
          <NuxtLink
            :to="`/c/${slug}/reveal`"
            class="rounded-lg border border-slate-700 px-3 py-1.5 text-sm"
          >
            Reveal
          </NuxtLink>
          <button
            type="button"
            class="rounded-lg border border-slate-700 px-3 py-1.5 text-sm"
            @click="load"
          >
            Refresh
          </button>
          <button
            type="button"
            class="rounded-lg bg-amber-400 px-3 py-1.5 text-sm font-semibold text-slate-950 disabled:opacity-50"
            :disabled="busy || data?.status === 'complete'"
            @click="playNext"
          >
            {{ busy ? 'Minting…' : 'Play next step myself' }}
          </button>
        </div>
      </header>

      <p
        v-if="error"
        class="rounded-lg border border-red-500/40 bg-red-950/50 px-3 py-2 text-sm text-red-200"
      >
        {{ error }}
      </p>

      <template v-else-if="data">
        <div class="rounded-xl border border-slate-800 bg-slate-900 p-4 text-sm space-y-1">
          <p><span class="text-slate-500">Status:</span> {{ data.status }}</p>
          <p><span class="text-slate-500">Progress:</span> step {{ data.current_step }} / {{ data.max_steps }} ({{ data.current_step_type }} · {{ data.current_step_status }})</p>
          <p><span class="text-slate-500">Last completer:</span> {{ data.last_completer_nickname || '—' }}</p>
          <p><span class="text-slate-500">Prompt:</span> {{ data.prompt_text }}</p>
        </div>

        <ol class="space-y-4">
          <li
            v-for="step in data.steps"
            :key="step.step_number"
            class="rounded-xl border border-slate-800 bg-slate-900 p-4"
          >
            <p class="text-sm font-semibold text-amber-200/90">
              Step {{ step.step_number }} · {{ step.type }} · {{ step.status }}
              <span
                v-if="step.author_nickname"
                class="font-normal text-slate-400"
              >— {{ step.author_nickname }}</span>
            </p>
            <CanvasReplayPlayer
              v-if="step.type === 'draw' && step.stroke_json && step.status === 'submitted'"
              class="mt-3"
              :document="step.stroke_json"
              :autoplay="false"
            />
            <p
              v-else-if="step.guess_text"
              class="mt-2 text-base"
            >
              “{{ step.guess_text }}”
            </p>
            <p
              v-else-if="step.status !== 'submitted'"
              class="mt-2 text-sm text-slate-500"
            >
              Seat not submitted yet.
            </p>
          </li>
        </ol>
      </template>
    </div>
  </main>
</template>
