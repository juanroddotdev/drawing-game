<script setup lang="ts">
import { DEFAULT_MAX_STEPS } from '~/types/chain'
import {
  buildLoopPathNodes,
  connectorAfter,
  loopPathAriaLabel,
  type LoopPathMode,
} from '~/utils/loopPathNodes'

const props = withDefaults(defineProps<{
  mode: LoopPathMode
  maxSteps?: number
  /** Play — step the player is on (1–max). */
  currentStep?: number
  /** Pass — last step handed off (1–max). */
  completedStep?: number
  /** Reveal — story has reached step N (0 = before step 1). */
  pathProgress?: number
  /** Reveal — brand/callback; all nodes done. */
  complete?: boolean
  /** Pass — nickname under the step just finished. */
  you?: string
  /** Same look as default; dims steps that are not current on this card. */
  tone?: 'default' | 'subtle'
}>(), {
  maxSteps: DEFAULT_MAX_STEPS,
  complete: false,
  tone: 'default',
})

const nodes = computed(() => buildLoopPathNodes({
  maxSteps: props.maxSteps,
  mode: props.mode,
  currentStep: props.currentStep,
  completedStep: props.completedStep,
  pathProgress: props.pathProgress,
  complete: props.complete,
}))

const ariaLabel = computed(() => loopPathAriaLabel({
  mode: props.mode,
  maxSteps: props.maxSteps,
  currentStep: props.currentStep,
  completedStep: props.completedStep,
  pathProgress: props.pathProgress,
  complete: props.complete,
}))

function nodeClass(node: { done: boolean, latest: boolean, next: boolean }) {
  if (node.done && !node.latest) return 'bg-[var(--ink)] text-white'
  if (node.latest) return 'bg-[var(--accent)] text-[var(--ink)] shadow-block'
  if (node.next) return 'bg-[var(--surface)] text-[var(--ink)] shadow-block'
  return 'bg-[var(--surface)] text-[var(--ink-muted)]'
}

function nodeOpacity(node: { done: boolean, latest: boolean, next: boolean }) {
  if (props.tone !== 'subtle') return ''
  if (props.complete) return 'opacity-100'
  if (node.latest || node.next) return 'opacity-100'
  return 'opacity-40'
}

function connectorOpacity(
  node: { latest: boolean, next: boolean },
  nextNode: { latest: boolean, next: boolean } | undefined,
) {
  if (props.tone !== 'subtle') return ''
  if (props.complete) return 'opacity-100'
  if (node.latest || node.next || nextNode?.latest || nextNode?.next) return 'opacity-100'
  return 'opacity-40'
}
</script>

<template>
  <div
    class="flex w-full max-w-sm items-start justify-center px-1"
    :class="mode === 'reveal' ? 'min-h-11' : ''"
    role="img"
    :aria-label="ariaLabel"
  >
    <div class="flex w-full items-center px-1">
      <template
        v-for="(node, idx) in nodes"
        :key="node.n"
      >
        <div
          class="flex shrink-0 flex-col items-center gap-1"
          :class="mode === 'pass' ? 'w-10' : ''"
        >
          <span
            class="flex size-9 items-center justify-center rounded-full border border-[var(--ink)] transition-[colors,opacity] duration-300"
            :class="[nodeClass(node), nodeOpacity(node)]"
            :title="node.type === 'draw' ? `Draw · step ${node.n}` : `Guess · step ${node.n}`"
          >
            <svg
              v-if="node.type === 'draw'"
              viewBox="0 0 24 24"
              class="h-4 w-4"
              fill="none"
              stroke="currentColor"
              stroke-width="2.25"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M12 19 5 12l7-9 2 5 5 2-7 9Z" />
              <path d="m9 15 5-5" />
            </svg>
            <svg
              v-else
              viewBox="0 0 24 24"
              class="h-4 w-4"
              fill="none"
              stroke="currentColor"
              stroke-width="2.25"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M7 8h10" />
              <path d="M7 12h6" />
              <path d="M21 15a2 2 0 0 1-2 2H8l-4 3V7a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z" />
            </svg>
          </span>
          <span
            v-if="mode === 'pass' && node.latest && you"
            class="max-w-[2.75rem] truncate text-center text-[10px] font-bold leading-tight text-[var(--ink)]"
          >
            {{ you }}
          </span>
        </div>

        <div
          v-if="idx < nodes.length - 1"
          class="flex h-9 min-w-[0.5rem] flex-1 items-center transition-opacity duration-300"
          :class="[
            mode === 'reveal' ? 'px-0.5' : '',
            connectorOpacity(node, nodes[idx + 1]),
          ]"
          aria-hidden="true"
        >
          <svg
            v-if="connectorAfter(node, mode, idx, nodes) === 'solid'"
            class="h-3 w-full text-[var(--ink)]"
            viewBox="0 0 40 12"
            preserveAspectRatio="none"
            fill="none"
          >
            <path
              d="M1 7 C10 2, 18 11, 28 5 S36 8, 39 6"
              stroke="currentColor"
              stroke-width="2.25"
              stroke-linecap="round"
            />
          </svg>
          <svg
            v-else-if="connectorAfter(node, mode, idx, nodes) === 'arrow'"
            class="h-4 w-full text-[var(--ink)]"
            viewBox="0 0 40 16"
            preserveAspectRatio="xMidYMid meet"
            fill="none"
          >
            <path
              d="M2 8 C12 3, 20 13, 28 8 L28 8"
              stroke="currentColor"
              stroke-width="2.25"
              stroke-linecap="round"
            />
            <path
              d="M24 4 L32 8 L24 12"
              stroke="currentColor"
              stroke-width="2.25"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <div
            v-else-if="connectorAfter(node, mode, idx, nodes) === 'hairline'"
            class="mx-1 h-px w-full bg-[var(--ink)]/20"
          />
        </div>
      </template>
    </div>
  </div>
</template>
