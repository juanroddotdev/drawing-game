<script setup lang="ts">
import type { DrawingDocument } from '~/types/stroke'
import { renderDocument } from '~/utils/canvas/render'

const props = defineProps<{
  document: DrawingDocument
}>()

const wrapRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
let cssSize = 300
let dpr = 1

function syncAndPaint() {
  const wrap = wrapRef.value
  const canvas = canvasRef.value
  if (!wrap || !canvas) return

  const size = Math.floor(wrap.clientWidth)
  cssSize = Math.max(160, size)
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
  window.addEventListener('resize', syncAndPaint)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', syncAndPaint)
})
</script>

<template>
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
</template>
