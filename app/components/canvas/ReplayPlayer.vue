<script setup lang="ts">
import type { DrawingDocument } from '~/types/stroke'
import { createEmptyDocument } from '~/utils/canvas/strokes'
import { documentDurationMs, filterStrokesUntil, renderDocument } from '~/utils/canvas/render'

const props = withDefaults(defineProps<{
  document: DrawingDocument
  /** Playback speed multiplier (2 = twice as fast). */
  speed?: number
  autoplay?: boolean
}>(), {
  speed: 2.5,
  autoplay: true,
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

const duration = computed(() => Math.max(documentDurationMs(props.document), 1))

function syncSize() {
  const wrap = wrapRef.value
  const canvas = canvasRef.value
  if (!wrap || !canvas) return
  cssSize = Math.max(160, Math.floor(wrap.clientWidth))
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = cssSize * dpr
  canvas.height = cssSize * dpr
  canvas.style.width = `${cssSize}px`
  canvas.style.height = `${cssSize}px`
  paint(progressMs.value)
}

function paint(untilMs: number) {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const partial = untilMs >= duration.value
    ? props.document
    : filterStrokesUntil(props.document, untilMs)
  renderDocument(ctx, partial.strokes.length ? partial : createEmptyDocument(props.document.aspect), cssSize, cssSize, dpr)
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
  progressMs.value = 0
  syncSize()
  if (props.autoplay) play()
  else paint(duration.value)
}, { deep: true })

onMounted(() => {
  syncSize()
  window.addEventListener('resize', syncSize)
  if (props.autoplay) play()
  else paint(duration.value)
})

onBeforeUnmount(() => {
  pause()
  window.removeEventListener('resize', syncSize)
})

defineExpose({ play, pause, replay, showFinal })
</script>

<template>
  <div class="space-y-2">
    <div
      ref="wrapRef"
      class="w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
    >
      <canvas
        ref="canvasRef"
        class="block w-full touch-none"
        style="touch-action: none"
      />
    </div>
    <div class="flex flex-wrap gap-2">
      <button
        type="button"
        class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium"
        @click="playing ? pause() : play()"
      >
        {{ playing ? 'Pause' : 'Play' }}
      </button>
      <button
        type="button"
        class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium"
        @click="replay"
      >
        Replay
      </button>
      <button
        type="button"
        class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium"
        @click="showFinal"
      >
        Skip
      </button>
    </div>
  </div>
</template>
