<script setup lang="ts">
import type { DrawingDocument } from '~/types/stroke'
import { renderDocument } from '~/utils/canvas/render'

const props = withDefaults(defineProps<{
  document: DrawingDocument
  /** No border/radius — parent frames the preview (e.g. submit sheet). */
  bare?: boolean
}>(), {
  bare: false,
})

const wrapRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
let cssSize = 300
let dpr = 1
let resizeObserver: ResizeObserver | null = null

function syncAndPaint() {
  const wrap = wrapRef.value
  const canvas = canvasRef.value
  if (!wrap || !canvas) return

  const size = Math.floor(wrap.clientWidth)
  if (size < 32) return

  cssSize = Math.max(120, size)
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = cssSize * dpr
  canvas.height = cssSize * dpr
  canvas.style.width = `${cssSize}px`
  canvas.style.height = `${cssSize}px`

  const ctx = canvas.getContext('2d')
  if (!ctx) return
  renderDocument(ctx, props.document, cssSize, cssSize, dpr)
}

watch(() => props.document, syncAndPaint, { deep: true })

onMounted(() => {
  syncAndPaint()
  if (wrapRef.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => syncAndPaint())
    resizeObserver.observe(wrapRef.value)
  }
  else {
    window.addEventListener('resize', syncAndPaint)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
  window.removeEventListener('resize', syncAndPaint)
})
</script>

<template>
  <div
    ref="wrapRef"
    class="w-full overflow-hidden bg-[var(--canvas)]"
    :class="bare ? '' : 'rounded-[var(--radius-chip)] border border-[var(--ink)] shadow-block'"
  >
    <canvas
      ref="canvasRef"
      class="block w-full touch-none"
      style="touch-action: none"
    />
  </div>
</template>
