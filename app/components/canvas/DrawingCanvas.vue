<script setup lang="ts">
import type { DrawingDocument } from '~/types/stroke'
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
  widths,
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
const drawing = ref(false)
let cssSize = 300
let dpr = 1

function syncCanvasSize() {
  const wrap = wrapRef.value
  const canvas = canvasRef.value
  if (!wrap || !canvas) return

  const size = Math.floor(wrap.clientWidth)
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
  // Live paint current tip
  const ctx = canvas.getContext('2d')
  if (ctx && document.value.strokes.length) {
    paintStroke(ctx, document.value.strokes[document.value.strokes.length - 1], cssSize, cssSize, dpr)
  }
}

function onContextMenu(e: Event) {
  e.preventDefault()
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

onMounted(() => {
  syncCanvasSize()
  window.addEventListener('resize', syncCanvasSize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', syncCanvasSize)
})

defineExpose({ clear, undo, canUndo })
</script>

<template>
  <div class="flex w-full flex-col gap-3">
    <div class="flex flex-wrap items-center gap-2">
      <div class="flex items-center gap-1.5">
        <button
          v-for="c in colors"
          :key="c"
          type="button"
          class="h-8 w-8 rounded-full border-2 transition"
          :class="color === c && tool === 'pen'
            ? 'border-slate-900 scale-110'
            : 'border-slate-300'"
          :style="{ backgroundColor: c }"
          :aria-label="`Color ${c}`"
          :disabled="disabled"
          @click="tool = 'pen'; color = c"
        />
      </div>

      <div class="mx-1 h-6 w-px bg-slate-200" />

      <div class="flex items-center gap-1">
        <button
          v-for="(w, i) in widths"
          :key="w"
          type="button"
          class="flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-medium"
          :class="width === w
            ? 'border-slate-900 bg-slate-900 text-white'
            : 'border-slate-300 bg-white text-slate-700'"
          :disabled="disabled"
          @click="width = w"
        >
          {{ ['S', 'M', 'L', 'XL'][i] }}
        </button>
      </div>

      <div class="mx-1 h-6 w-px bg-slate-200" />

      <button
        type="button"
        class="rounded-lg border px-3 py-1.5 text-sm font-medium"
        :class="tool === 'eraser'
          ? 'border-slate-900 bg-slate-900 text-white'
          : 'border-slate-300 bg-white'"
        :disabled="disabled"
        @click="tool = tool === 'eraser' ? 'pen' : 'eraser'"
      >
        Eraser
      </button>
      <button
        type="button"
        class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium disabled:opacity-40"
        :disabled="disabled || !canUndo"
        @click="undo"
      >
        Undo
      </button>
      <button
        type="button"
        class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium"
        :disabled="disabled"
        @click="clear"
      >
        Clear
      </button>
    </div>

    <div
      ref="wrapRef"
      class="relative w-full max-w-lg overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm"
    >
      <canvas
        ref="canvasRef"
        class="block touch-none select-none"
        style="touch-action: none; -webkit-user-select: none; -webkit-touch-callout: none;"
        :class="disabled ? 'pointer-events-none opacity-70' : 'cursor-crosshair'"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
        @contextmenu="onContextMenu"
      />
    </div>
  </div>
</template>
