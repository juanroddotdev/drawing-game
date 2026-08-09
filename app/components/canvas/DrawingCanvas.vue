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
const clearBtnRef = ref<HTMLButtonElement | null>(null)
const drawing = ref(false)
const sizing = ref(false)
const clearPromptOpen = ref(false)
const clearToastStyle = ref<Record<string, string>>({})
let cssSize = 300
let dpr = 1
let resizeObserver: ResizeObserver | null = null

const sizePreviewPx = computed(() => Math.max(6, width.value * Math.min(cssSize, 360)))
const sizeThumbColor = computed(() => (tool.value === 'eraser' ? '#e2e8f0' : color.value))

/** Dark fills need a light edge so they don't melt into the hard ink shadow. */
function isDarkFill(hex: string): boolean {
  const h = hex.replace('#', '')
  if (h.length !== 6) return hex === '#111827' || hex === '#000000'
  const r = Number.parseInt(h.slice(0, 2), 16)
  const g = Number.parseInt(h.slice(2, 4), 16)
  const b = Number.parseInt(h.slice(4, 6), 16)
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
  return lum < 0.35
}

const sizeThumbStyle = computed(() => {
  const bg = sizeThumbColor.value
  const dark = tool.value !== 'eraser' && isDarkFill(bg)
  return {
    backgroundColor: bg,
    boxShadow: dark
      ? '0 0 0 1.5px #fff, 2px 2px 0 var(--ink)'
      : '2px 2px 0 var(--ink)',
  }
})

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

function positionClearToast() {
  const wrap = wrapRef.value
  const btn = clearBtnRef.value
  if (!wrap || !btn) return
  const wr = wrap.getBoundingClientRect()
  const br = btn.getBoundingClientRect()
  clearToastStyle.value = {
    left: `${Math.max(8, Math.min(br.left - wr.left, wr.width - 16))}px`,
    bottom: `${Math.max(8, wr.bottom - br.top + 8)}px`,
  }
}

function requestClear() {
  if (props.disabled) return
  if (document.value.strokes.length === 0) return
  clearPromptOpen.value = true
  nextTick(positionClearToast)
}

function confirmClear() {
  clear()
  clearPromptOpen.value = false
}

function cancelClear() {
  clearPromptOpen.value = false
}

onMounted(() => {
  syncCanvasSize()
  window.addEventListener('resize', syncCanvasSize)
  if (wrapRef.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => syncCanvasSize())
    resizeObserver.observe(wrapRef.value)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', syncCanvasSize)
  resizeObserver?.disconnect()
})

defineExpose({ clear, undo, canUndo, syncCanvasSize })
</script>

<template>
  <div class="relative h-full min-h-[16rem] w-full">
    <div
      ref="wrapRef"
      class="relative mx-auto h-full w-full max-w-[100dvh] overflow-hidden bg-[var(--canvas)] sm:rounded-xl sm:border sm:border-[var(--ink)] sm:shadow-block"
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

      <!-- Primary action (Done) — Instagram-style top right -->
      <div
        v-if="$slots.action"
        class="pointer-events-none absolute right-2 top-14 z-20 sm:top-3"
      >
        <div
          class="pointer-events-auto"
          @pointerdown.stop
        >
          <slot name="action" />
        </div>
      </div>

      <!-- Clear confirm — outside dock overflow so it isn't clipped -->
      <div
        v-if="clearPromptOpen"
        class="pointer-events-none absolute z-40 w-[min(18rem,calc(100%-1.5rem))] -translate-x-0"
        :style="clearToastStyle"
      >
        <div
          class="pointer-events-auto"
          @pointerdown.stop
        >
          <UiSketchToast
            message="Clear the whole drawing?"
            tone="alert"
            confirm-label="Clear"
            :auto-dismiss-ms="0"
            @confirm="confirmClear"
            @dismiss="cancelClear"
          />
        </div>
      </div>

      <!-- Left size slider -->
      <div class="absolute left-1 top-1/2 z-10 flex -translate-y-1/2 flex-col items-center">
        <div
          v-if="sizing"
          class="pointer-events-none absolute bottom-full mb-3 rounded-full border-2 border-[var(--ink)] bg-transparent"
          :style="{
            width: `${sizePreviewPx}px`,
            height: `${sizePreviewPx}px`,
          }"
        />
        <div
          ref="sliderRef"
          class="flex h-44 w-11 touch-none items-center justify-center"
          style="touch-action: none"
          @pointerdown="onSliderPointerDown"
          @pointermove="onSliderPointerMove"
          @pointerup="onSliderPointerUp"
          @pointercancel="onSliderPointerUp"
        >
          <div class="relative h-full w-1.5 rounded-full bg-[var(--surface)] ring-2 ring-[var(--ink)]">
            <div
              class="absolute left-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--ink)]"
              :style="{
                top: `${((BRUSH_WIDTH_MAX - width) / (BRUSH_WIDTH_MAX - BRUSH_WIDTH_MIN)) * 100}%`,
                backgroundColor: sizeThumbStyle.backgroundColor,
                boxShadow: sizeThumbStyle.boxShadow,
              }"
            />
          </div>
        </div>
        <!-- Tool cue under track (icon only) -->
        <div
          class="pointer-events-none mt-5 text-[var(--ink)]"
          :aria-label="tool === 'eraser' ? 'Eraser size' : 'Pen size'"
          :title="tool === 'eraser' ? 'Eraser size' : 'Pen size'"
        >
          <svg
            v-if="tool !== 'eraser'"
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
            <path d="m5 12 4 4" />
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
            <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
            <path d="M22 21H7" />
            <path d="m5 11 9 9" />
          </svg>
        </div>
      </div>

      <!-- Bottom thumb dock: Undo · Eraser · Clear · swatches -->
      <div
        class="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-[var(--paper-deep)]/80 via-transparent to-transparent px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-8"
      >
        <div
          class="dock-sketch pointer-events-auto flex w-full items-center gap-1.5 overflow-x-auto p-1.5"
          style="-webkit-overflow-scrolling: touch"
        >
          <button
            type="button"
            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-800 disabled:opacity-35"
            :disabled="disabled || !canUndo"
            aria-label="Undo last stroke"
            title="Undo"
            @pointerdown.stop
            @click="undo"
          >
            <svg
              viewBox="0 0 24 24"
              class="h-5 w-5"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M9 14 4 9l5-5" />
              <path d="M4 9h10a6 6 0 0 1 0 12h-3" />
            </svg>
          </button>
          <button
            type="button"
            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
            :class="tool === 'eraser'
              ? 'bg-[var(--ink)] text-white'
              : 'text-[var(--ink)]'"
            :disabled="disabled"
            aria-label="Eraser"
            title="Eraser"
            @pointerdown.stop
            @click="tool = tool === 'eraser' ? 'pen' : 'eraser'"
          >
            <svg
              viewBox="0 0 24 24"
              class="h-5 w-5"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
              <path d="M22 21H7" />
              <path d="m5 11 9 9" />
            </svg>
          </button>
          <button
            ref="clearBtnRef"
            type="button"
            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-500"
            :disabled="disabled"
            aria-label="Clear drawing"
            title="Clear"
            @pointerdown.stop
            @click="requestClear"
          >
            <svg
              viewBox="0 0 24 24"
              class="h-4 w-4"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M3 6h18" />
              <path d="M8 6V4h8v2" />
              <path d="m19 6-1 14H6L5 6" />
            </svg>
          </button>
          <div
            class="mx-0.5 h-8 w-px shrink-0 bg-slate-300/80"
            aria-hidden="true"
          />
          <button
            v-for="c in colors"
            :key="c"
            type="button"
            class="h-10 w-10 shrink-0 rounded-full border-2 transition"
            :class="color === c && tool === 'pen'
              ? 'border-[var(--ink)] scale-105 shadow-block'
              : 'border-[var(--ink)]/30'"
            :style="{ backgroundColor: c }"
            :aria-label="`Color ${c}`"
            :disabled="disabled"
            @pointerdown.stop
            @click="tool = 'pen'; color = c"
          />
        </div>
      </div>
    </div>
  </div>
</template>
