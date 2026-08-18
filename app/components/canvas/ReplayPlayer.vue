<script setup lang="ts">
import type { DrawingDocument } from '~/types/stroke'
import { createEmptyDocument } from '~/utils/canvas/strokes'
import { documentDurationMs, filterStrokesUntil, renderDocument } from '~/utils/canvas/render'

const props = withDefaults(defineProps<{
  document: DrawingDocument
  /** Playback speed multiplier (2 = twice as fast). */
  speed?: number
  autoplay?: boolean
  /** full = play/pause/skip; minimal = canvas + Replay; overlay = canvas + corner play. */
  chrome?: 'full' | 'minimal' | 'overlay'
  /** When set (0–1), parent owns the timeline: no autoplay, no chrome play button. */
  progress?: number
}>(), {
  speed: 2.5,
  autoplay: true,
  chrome: 'full',
})

const emit = defineEmits<{
  finished: []
}>()

const wrapRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const playing = ref(false)
const progressMs = ref(0)

let cssSize = 300
let dpr = 1
let raf = 0
let lastFrame = 0
let resizeObserver: ResizeObserver | null = null

const duration = computed(() => Math.max(documentDurationMs(props.document), 1))
const controlled = computed(() => typeof props.progress === 'number')

function syncSize() {
  const wrap = wrapRef.value
  const canvas = canvasRef.value
  if (!wrap || !canvas) return
  const size = Math.floor(Math.min(wrap.clientWidth, wrap.clientHeight || wrap.clientWidth))
  if (size < 32) return
  cssSize = Math.max(160, size)
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = cssSize * dpr
  canvas.height = cssSize * dpr
  canvas.style.width = `${cssSize}px`
  canvas.style.height = `${cssSize}px`
  if (!paintProgress()) paint(progressMs.value)
}

function paint(untilMs: number) {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const empty = createEmptyDocument(props.document.aspect)
  if (untilMs < 0) {
    renderDocument(ctx, empty, cssSize, cssSize, dpr)
    return
  }
  const partial = untilMs >= duration.value
    ? props.document
    : filterStrokesUntil(props.document, untilMs)
  renderDocument(ctx, partial.strokes.length ? partial : empty, cssSize, cssSize, dpr)
}

function paintProgress() {
  if (typeof props.progress !== 'number') return false
  pause()
  const p = props.progress
  const until = p <= 0 ? -1 : p >= 1 ? duration.value : p * duration.value
  progressMs.value = Math.max(0, until)
  paint(until)
  return true
}

function tick(now: number) {
  if (!playing.value) return
  const dt = lastFrame ? (now - lastFrame) * props.speed : 0
  lastFrame = now
  progressMs.value = Math.min(duration.value, progressMs.value + dt)
  paint(progressMs.value)
  if (progressMs.value >= duration.value) {
    playing.value = false
    emit('finished')
    return
  }
  raf = requestAnimationFrame(tick)
}

function play() {
  if (progressMs.value >= duration.value) {
    progressMs.value = 0
  }
  playing.value = true
  lastFrame = 0
  cancelAnimationFrame(raf)
  raf = requestAnimationFrame(tick)
}

function pause() {
  playing.value = false
  cancelAnimationFrame(raf)
}

function replay() {
  progressMs.value = 0
  paint(0)
  play()
}

function showFinal() {
  pause()
  progressMs.value = duration.value
  paint(progressMs.value)
  emit('finished')
}

watch(() => props.document, () => {
  if (paintProgress()) {
    syncSize()
    return
  }
  progressMs.value = 0
  syncSize()
  if (props.autoplay) play()
  else paint(duration.value)
}, { deep: true })

watch(() => props.progress, () => {
  paintProgress()
})

onMounted(() => {
  syncSize()
  if (wrapRef.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => syncSize())
    resizeObserver.observe(wrapRef.value)
  }
  else {
    window.addEventListener('resize', syncSize)
  }
  if (paintProgress()) return
  if (props.autoplay) play()
  else paint(duration.value)
})

onBeforeUnmount(() => {
  pause()
  resizeObserver?.disconnect()
  window.removeEventListener('resize', syncSize)
})

defineExpose({ play, pause, replay, showFinal })
</script>

<template>
  <div :class="chrome === 'overlay' ? 'relative h-full w-full' : 'space-y-2'">
    <div
      ref="wrapRef"
      class="overflow-hidden bg-[var(--canvas)]"
      :class="chrome === 'overlay'
        ? 'h-full w-full'
        : chrome === 'minimal'
          ? 'w-full border border-[var(--ink)]'
          : 'w-full rounded-[var(--radius-chip)] border border-[var(--ink)] shadow-block'"
    >
      <canvas
        ref="canvasRef"
        class="block w-full touch-none"
        style="touch-action: none"
      />
    </div>

    <button
      v-if="chrome === 'overlay' && !playing && !controlled"
      type="button"
      class="absolute bottom-2.5 right-2.5 z-10 flex size-9 items-center justify-center rounded-full border border-[var(--ink)] bg-[var(--surface)] text-[var(--ink)] shadow-block transition hover:bg-[var(--accent)]"
      aria-label="Play drawing"
      @click="play"
    >
      <svg
        viewBox="0 0 24 24"
        class="ml-0.5 h-4 w-4"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M8 5.5v13l11-6.5L8 5.5Z" />
      </svg>
    </button>

    <div
      v-else-if="chrome === 'minimal'"
      class="flex justify-center"
    >
      <button
        type="button"
        class="btn-quiet !px-2 !py-1 text-xs"
        @click="replay"
      >
        Replay
      </button>
    </div>
    <div
      v-else-if="chrome === 'full'"
      class="flex flex-wrap gap-2"
    >
      <button
        type="button"
        class="btn-ink !px-3 !py-1.5 text-sm"
        @click="playing ? pause() : play()"
      >
        {{ playing ? 'Pause' : 'Play' }}
      </button>
      <button
        type="button"
        class="btn-quiet !px-3 !py-1.5 text-sm"
        @click="replay"
      >
        Replay
      </button>
      <button
        type="button"
        class="btn-quiet !px-3 !py-1.5 text-sm"
        @click="showFinal"
      >
        Skip
      </button>
    </div>
  </div>
</template>
