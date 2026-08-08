<script setup lang="ts">
import type { DrawingDocument } from '~/types/stroke'
import { BRUSH_WIDTH_MAX, BRUSH_WIDTH_MIN } from '~/types/stroke'
import { renderDocument, paintStroke } from '~/utils/canvas/render'

const props = withDefaults(defineProps<{
  modelValue: DrawingDocument
  disabled?: boolean
}>(), {
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [DrawingDocument]
}>()

const session = useDrawingSession(props.modelValue)
const {
  document,
  color,
  width,
  tool,
  canUndo,
  colors,
  clear,
  undo,
  beginStroke,
  appendPoint,
  setDocument,
} = session

watch(
  () => props.modelValue,
  (doc) => {
    if (doc !== document.value) {
      setDocument(doc)
    }
  },
)

watch(
  document,
  (doc) => {
    emit('update:modelValue', doc)
    paint()
  },
  { deep: true },
)

const wrapRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const sliderRef = ref<HTMLElement | null>(null)
const drawing = ref(false)
const sizing = ref(false)
let cssSize = 300
let dpr = 1

const sizePreviewPx = computed(() => Math.max(6, width.value * Math.min(cssSize, 360)))

function syncCanvasSize() {
  const wrap = wrapRef.value
  const canvas = canvasRef.value
  if (!wrap || !canvas) return

  const size = Math.floor(Math.min(wrap.clientWidth, wrap.clientHeight || wrap.clientWidth))
  cssSize = Math.max(200, size)
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = cssSize * dpr
  canvas.height = cssSize * dpr
  canvas.style.width = `${cssSize}px`
  canvas.style.height = `${cssSize}px`
  paint()
}

function paint() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  renderDocument(ctx, document.value, cssSize, cssSize, dpr)
}

function pointerToNorm(e: PointerEvent): { x: number, y: number } | null {
  const canvas = canvasRef.value
  if (!canvas) return null
  const rect = canvas.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) return null
  return {
    x: Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
    y: Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)),
  }
}

function onPointerDown(e: PointerEvent) {
  if (props.disabled) return
  const canvas = canvasRef.value
  if (!canvas) return
  e.preventDefault()
  canvas.setPointerCapture(e.pointerId)
  drawing.value = true
  const p = pointerToNorm(e)
  if (!p) return
  beginStroke(p.x, p.y)
  const ctx = canvas.getContext('2d')
  if (ctx && document.value.strokes.length) {
    paintStroke(ctx, document.value.strokes[document.value.strokes.length - 1], cssSize, cssSize, dpr)
  }
}

function onPointerMove(e: PointerEvent) {
  if (!drawing.value || props.disabled) return
  const p = pointerToNorm(e)
  if (!p) return
  appendPoint(p.x, p.y)
}

function onPointerUp(e: PointerEvent) {
  if (!drawing.value) return
  drawing.value = false
  try {
    canvasRef.value?.releasePointerCapture(e.pointerId)
  }
  catch {
    /* already released */
  }
}

function onContextMenu(e: Event) {
  e.preventDefault()
}

function setWidthFromClientY(clientY: number) {
  const el = sliderRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  if (rect.height <= 0) return
  // Top = thick, bottom = thin (Instagram-like)
  const t = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height))
  width.value = BRUSH_WIDTH_MAX - t * (BRUSH_WIDTH_MAX - BRUSH_WIDTH_MIN)
}

function onSliderPointerDown(e: PointerEvent) {
  if (props.disabled) return
  e.preventDefault()
  sizing.value = true
  sliderRef.value?.setPointerCapture(e.pointerId)
  setWidthFromClientY(e.clientY)
}

function onSliderPointerMove(e: PointerEvent) {
  if (!sizing.value) return
  setWidthFromClientY(e.clientY)
}

function onSliderPointerUp(e: PointerEvent) {
  if (!sizing.value) return
  sizing.value = false
  try {
    sliderRef.value?.releasePointerCapture(e.pointerId)
  }
  catch {
    /* ignore */
  }
}

function requestClear() {
  if (props.disabled) return
  if (document.value.strokes.length === 0) return
  if (window.confirm('Clear the whole drawing?')) {
    clear()
  }
}

onMounted(() => {
  syncCanvasSize()
  window.addEventListener('resize', syncCanvasSize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', syncCanvasSize)
})

defineExpose({ clear, undo, canUndo, syncCanvasSize })
</script>

<template>
  <div class="flex w-full flex-col gap-2">
    <!-- Top tools -->
    <div class="flex items-center justify-between gap-2 px-1">
      <button
        type="button"
        class="flex h-11 min-w-11 items-center justify-center rounded-full border border-slate-300 bg-white text-sm font-semibold text-slate-800 disabled:opacity-40"
        :disabled="disabled || !canUndo"
        aria-label="Undo"
        @click="undo"
      >
        Undo
      </button>
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="flex h-11 min-w-11 items-center justify-center rounded-full border px-3 text-sm font-semibold"
          :class="tool === 'eraser'
            ? 'border-slate-900 bg-slate-900 text-white'
            : 'border-slate-300 bg-white text-slate-800'"
          :disabled="disabled"
          @click="tool = tool === 'eraser' ? 'pen' : 'eraser'"
        >
          Eraser
        </button>
        <button
          type="button"
          class="flex h-11 min-w-11 items-center justify-center rounded-full border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800"
          :disabled="disabled"
          @click="requestClear"
        >
          Clear
        </button>
      </div>
    </div>

    <!-- Canvas + left size slider -->
    <div class="relative w-full">
      <div
        ref="wrapRef"
        class="relative mx-auto aspect-square w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm"
      >
        <canvas
          ref="canvasRef"
          class="absolute inset-0 m-auto block touch-none select-none"
          style="touch-action: none; -webkit-user-select: none; -webkit-touch-callout: none;"
          :class="disabled ? 'pointer-events-none opacity-70' : 'cursor-crosshair'"
          @pointerdown="onPointerDown"
          @pointermove="onPointerMove"
          @pointerup="onPointerUp"
          @pointercancel="onPointerUp"
          @contextmenu="onContextMenu"
        />

        <!-- Vertical size slider -->
        <div
          class="absolute left-2 top-1/2 z-10 flex -translate-y-1/2 flex-col items-center"
        >
          <div
            v-if="sizing"
            class="pointer-events-none absolute bottom-full mb-3 rounded-full border-2 border-slate-900/80 bg-white/90 shadow"
            :style="{ width: `${sizePreviewPx}px`, height: `${sizePreviewPx}px` }"
          />
          <div
            ref="sliderRef"
            class="flex h-40 w-11 touch-none items-center justify-center"
            style="touch-action: none"
            @pointerdown="onSliderPointerDown"
            @pointermove="onSliderPointerMove"
            @pointerup="onSliderPointerUp"
            @pointercancel="onSliderPointerUp"
          >
            <div class="relative h-full w-1.5 rounded-full bg-slate-300">
              <div
                class="absolute left-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-slate-900 bg-white shadow"
                :style="{
                  top: `${((BRUSH_WIDTH_MAX - width) / (BRUSH_WIDTH_MAX - BRUSH_WIDTH_MIN)) * 100}%`,
                }"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom color dock -->
    <div
      class="flex gap-2 overflow-x-auto px-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] pt-1"
      style="-webkit-overflow-scrolling: touch"
    >
      <button
        v-for="c in colors"
        :key="c"
        type="button"
        class="h-11 w-11 shrink-0 rounded-full border-2 transition"
        :class="color === c && tool === 'pen'
          ? 'border-slate-900 scale-105'
          : 'border-slate-300'"
        :style="{ backgroundColor: c }"
        :aria-label="`Color ${c}`"
        :disabled="disabled"
        @click="tool = 'pen'; color = c"
      />
    </div>
  </div>
</template>
