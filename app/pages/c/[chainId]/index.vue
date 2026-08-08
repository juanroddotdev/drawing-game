<script setup lang="ts">
import type { ChainHubStatus } from '~/types/chain'

const route = useRoute()
const api = useChainApi()
const { nickname, save } = usePlayerProfile()

const slug = computed(() => String(route.params.chainId || ''))
const status = ref<ChainHubStatus | null>(null)
const error = ref('')
const reopenError = ref('')
const busy = ref(false)

useHead({ title: computed(() => `Chain ${slug.value}`) })

const statusLabel = computed(() => {
  if (!status.value) return ''
  switch (status.value.status) {
    case 'complete': return 'Complete — reveal is open'
    case 'open_seat': return 'Seat open — last player can re-invite'
    case 'awaiting_pass': return 'Waiting for the next player'
    case 'active': return 'In progress'
    default: return status.value.status
  }
})

async function load() {
  error.value = ''
  try {
    status.value = await api.getChainStatus(slug.value)
    if (status.value.status === 'complete') {
      // keep hub visible with reveal CTA
    }
  }
  catch (e) {
    error.value = e instanceof Error ? e.message : 'Could not load chain'
    status.value = null
  }
}

async function reopen() {
  reopenError.value = ''
  if (!nickname.value.trim()) {
    reopenError.value = 'Enter the nickname of the last person who played.'
    return
  }
  busy.value = true
  try {
    save()
    const result = await api.reopenSeat(slug.value, nickname.value.trim())
    await navigateTo({
      path: `/c/${slug.value}/pass`,
      query: {
        token: result.claim_token,
        step: String(result.next_step),
        you: nickname.value.trim(),
      },
    })
  }
  catch (e) {
    reopenError.value = e instanceof Error ? e.message : 'Could not reopen seat'
  }
  finally {
    busy.value = false
  }
}

onMounted(load)
</script>

<template>
  <main class="min-h-dvh bg-gradient-to-b from-slate-100 to-slate-200 px-4 py-8 text-slate-900">
    <div class="mx-auto flex max-w-lg flex-col gap-6">
      <header class="space-y-1">
        <NuxtLink
          to="/"
          class="text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          ← Home
        </NuxtLink>
        <h1 class="text-2xl font-bold tracking-tight">
          Chain status
        </h1>
        <p class="font-mono text-sm text-slate-500">
          {{ slug }}
        </p>
      </header>

      <p
        v-if="error"
        class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
      >
        {{ error }}
      </p>

      <template v-else-if="status">
        <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-2">
          <p class="text-base font-semibold">
            {{ statusLabel }}
          </p>
          <p class="text-sm text-slate-600">
            Step {{ status.current_step }} of {{ status.max_steps }}
            · {{ status.step_type }}
            · seat {{ status.step_status }}
          </p>
          <p
            v-if="status.due_at && status.status !== 'complete'"
            class="text-xs text-slate-500"
          >
            Due {{ new Date(status.due_at).toLocaleString() }}
          </p>
          <p
            v-if="status.last_completer_nickname"
            class="text-xs text-slate-500"
          >
            Last player: {{ status.last_completer_nickname }}
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <NuxtLink
            v-if="status.status === 'complete'"
            :to="`/c/${slug}/reveal`"
            class="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
          >
            Open reveal
          </NuxtLink>
          <NuxtLink
            :to="`/c/${slug}/dev`"
            class="rounded-xl border border-dashed border-slate-400 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
          >
            Dev inspector
          </NuxtLink>
          <button
            type="button"
            class="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold"
            @click="load"
          >
            Refresh
          </button>
        </div>

        <section
          v-if="status.status === 'open_seat' || status.step_status === 'expired'"
          class="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4"
        >
          <h2 class="text-sm font-semibold text-amber-950">
            Re-invite someone
          </h2>
          <p class="text-sm text-amber-900/80">
            If the last player was you, confirm your nickname to mint a fresh pass link.
          </p>
          <input
            v-model="nickname"
            type="text"
            maxlength="32"
            class="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm"
            placeholder="Your nickname (last completer)"
          >
          <p
            v-if="reopenError"
            class="text-sm text-red-600"
          >
            {{ reopenError }}
          </p>
          <button
            type="button"
            class="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
            :disabled="busy"
            @click="reopen"
          >
            {{ busy ? 'Working…' : 'Get new share link' }}
          </button>
        </section>
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
