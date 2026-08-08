<script setup lang="ts">
import type { RevealPayload, RevealStep } from '~/types/chain'

const props = defineProps<{
  reveal: RevealPayload
}>()

type Scene =
  | { kind: 'prompt' }
  | { kind: 'step', step: RevealStep }

const scenes = computed<Scene[]>(() => {
  const list: Scene[] = [{ kind: 'prompt' }]
  for (const step of props.reveal.steps) {
    list.push({ kind: 'step', step })
  }
  return list
})

const index = ref(0)
const showAll = ref(false)
const replayKey = ref(0)

const current = computed(() => scenes.value[index.value]!)
const isLast = computed(() => index.value >= scenes.value.length - 1)
const progressLabel = computed(() => `${index.value + 1} / ${scenes.value.length}`)

function next() {
  if (isLast.value) {
    showAll.value = true
    return
  }
  index.value += 1
  replayKey.value += 1
}

function prev() {
  showAll.value = false
  if (index.value > 0) {
    index.value -= 1
    replayKey.value += 1
  }
}

function restart() {
  showAll.value = false
  index.value = 0
  replayKey.value += 1
}

function jumpToEnd() {
  showAll.value = true
  index.value = scenes.value.length - 1
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <p class="text-sm font-medium text-slate-600">
        {{ showAll ? 'Full gallery' : `Reveal ${progressLabel}` }}
      </p>
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium disabled:opacity-40"
          :disabled="index === 0 && !showAll"
          @click="prev"
        >
          Back
        </button>
        <button
          v-if="!showAll"
          type="button"
          class="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white"
          @click="next"
        >
          {{ isLast ? 'Show all' : 'Next' }}
        </button>
        <button
          v-else
          type="button"
          class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium"
          @click="restart"
        >
          Replay show
        </button>
        <button
          v-if="!showAll"
          type="button"
          class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium"
          @click="jumpToEnd"
        >
          Skip to gallery
        </button>
      </div>
    </div>

    <!-- Staged curtain reveal -->
    <div
      v-if="!showAll"
      class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <template v-if="current.kind === 'prompt'">
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">
          It started with…
        </p>
        <p class="mt-2 text-2xl font-bold tracking-tight">
          {{ reveal.prompt_text }}
        </p>
        <p class="mt-2 text-sm text-slate-500">
          by {{ reveal.creator_nickname }}
        </p>
      </template>

      <template v-else>
        <p class="text-sm font-semibold text-slate-700">
          Step {{ current.step.step_number }}
          · {{ current.step.type }}
          <span
            v-if="current.step.author_nickname"
            class="font-normal text-slate-500"
          >— {{ current.step.author_nickname }}</span>
        </p>

        <div
          v-if="current.step.type === 'draw' && current.step.stroke_json"
          class="mt-3"
        >
          <CanvasReplayPlayer
            :key="replayKey"
            :document="current.step.stroke_json"
          />
        </div>
        <p
          v-else-if="current.step.guess_text"
          class="mt-4 text-xl font-medium"
        >
          “{{ current.step.guess_text }}”
        </p>
      </template>
    </div>

    <!-- Full gallery dump -->
    <div
      v-else
      class="space-y-4"
    >
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
          <CanvasReplayPlayer
            v-if="step.type === 'draw' && step.stroke_json"
            :key="`all-${step.step_number}`"
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
        </li>
      </ol>
    </div>
  </div>
</template>
