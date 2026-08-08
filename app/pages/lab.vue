<script setup lang="ts">
import type { DrawingDocument } from '~/types/stroke'
import { createEmptyDocument, documentToJson, parseDrawingDocument } from '~/utils/canvas/strokes'

useHead({
  title: 'PenPass — Canvas Lab',
})

const drawing = ref<DrawingDocument>(createEmptyDocument())
const jsonText = ref('')
const loadError = ref('')
const preview = ref<DrawingDocument | null>(null)

function exportJson() {
  jsonText.value = documentToJson(drawing.value)
  loadError.value = ''
  preview.value = null
}

function reRenderFromJson() {
  loadError.value = ''
  try {
    const doc = parseDrawingDocument(jsonText.value)
    preview.value = doc
    drawing.value = doc
  }
  catch (e) {
    loadError.value = e instanceof Error ? e.message : 'Failed to parse JSON'
    preview.value = null
  }
}
</script>

<template>
  <main class="min-h-dvh bg-gradient-to-b from-slate-100 to-slate-200 px-4 py-8 text-slate-900">
    <div class="mx-auto flex max-w-5xl flex-col gap-8">
      <header class="space-y-2">
        <NuxtLink
          to="/"
          class="text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          ← Home
        </NuxtLink>
        <p class="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Phase 1
        </p>
        <h1 class="text-3xl font-bold tracking-tight">
          PenPass canvas lab
        </h1>
        <p class="max-w-2xl text-slate-600">
          Draw with vector strokes, export JSON, and re-render. No accounts or chains.
        </p>
      </header>

      <section class="grid gap-8 lg:grid-cols-2">
        <div class="space-y-3">
          <h2 class="text-lg font-semibold">
            Draw
          </h2>
          <CanvasDrawingCanvas v-model="drawing" />
          <p class="text-sm text-slate-500">
            {{ drawing.strokes.length }} stroke{{ drawing.strokes.length === 1 ? '' : 's' }}
          </p>
        </div>

        <div class="space-y-3">
          <h2 class="text-lg font-semibold">
            JSON round-trip
          </h2>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white"
              @click="exportJson"
            >
              Export JSON
            </button>
            <button
              type="button"
              class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium"
              @click="reRenderFromJson"
            >
              Re-render from JSON
            </button>
          </div>
          <textarea
            v-model="jsonText"
            rows="12"
            class="w-full rounded-xl border border-slate-300 bg-white p-3 font-mono text-xs leading-relaxed text-slate-800"
            placeholder="Exported stroke JSON appears here…"
            spellcheck="false"
          />
          <p
            v-if="loadError"
            class="text-sm text-red-600"
          >
            {{ loadError }}
          </p>
          <div
            v-if="preview"
            class="space-y-2"
          >
            <h3 class="text-sm font-medium text-slate-600">
              Preview from JSON
            </h3>
            <CanvasStrokeRenderer :document="preview" />
          </div>
        </div>
      </section>
    </div>
  </main>
</template>
