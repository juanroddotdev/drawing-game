<script setup lang="ts">
/**
 * Framed screen tour — iframe so Tailwind breakpoints match the form factor.
 */
import {
  LAB_FORM_FACTORS,
  LAB_TOUR_SLIDES,
  labFormFactorMeta,
  labFrameTo,
  labSlideEmbedSrc,
  labTourNeighbors,
  labTourSlide,
  parseLabFormFactor,
  type LabFormFactor,
} from '~/utils/lab/tour'

if (!import.meta.dev) {
  await navigateTo('/')
}

const route = useRoute()
const router = useRouter()

const slideId = computed(() => {
  const q = route.query.slide
  if (typeof q === 'string' && labTourSlide(q)) return q
  return LAB_TOUR_SLIDES[0]!.id
})

const formFactor = computed(() => parseLabFormFactor(route.query.ff))
const slide = computed(() => labTourSlide(slideId.value)!)
const neighbors = computed(() => labTourNeighbors(slideId.value))
const frame = computed(() => labFormFactorMeta(formFactor.value))

const embedSrc = computed(() => labSlideEmbedSrc(slide.value))

const stageRef = ref<HTMLElement | null>(null)
const scale = ref(1)

function updateScale() {
  const el = stageRef.value
  if (!el) return
  const pad = 8
  const availW = Math.max(0, el.clientWidth - pad)
  const availH = Math.max(0, el.clientHeight - pad)
  const { width, height } = frame.value
  const next = Math.min(1, availW / width, availH / height)
  scale.value = Number.isFinite(next) && next > 0 ? next : 1
}

useHead({
  title: computed(() => `${slide.value.title} · ${frame.value.label} lab`),
})

function setFormFactor(ff: LabFormFactor) {
  router.replace(labFrameTo(slideId.value, ff))
}

function goSlide(id: string) {
  navigateTo(labFrameTo(id, formFactor.value))
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'ArrowRight' && neighbors.value.next) {
    e.preventDefault()
    goSlide(neighbors.value.next.id)
  }
  else if (e.key === 'ArrowLeft' && neighbors.value.prev) {
    e.preventDefault()
    goSlide(neighbors.value.prev.id)
  }
  else if (e.key === 'Escape') {
    e.preventDefault()
    navigateTo('/lab/screens')
  }
  else if (e.key === '1') {
    e.preventDefault()
    setFormFactor('mobile')
  }
  else if (e.key === '2') {
    e.preventDefault()
    setFormFactor('tablet')
  }
  else if (e.key === '3') {
    e.preventDefault()
    setFormFactor('desktop')
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKey)
  updateScale()
  window.addEventListener('resize', updateScale)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('resize', updateScale)
})

watch([formFactor, slideId], async () => {
  await nextTick()
  updateScale()
})
</script>

<template>
  <div class="flex h-dvh flex-col bg-[var(--ink)] text-[var(--paper)]">
    <!-- Host chrome — outside the device frame -->
    <header
      class="flex shrink-0 flex-wrap items-center gap-2 border-b border-white/15 px-3 py-2"
      style="padding-top: max(0.5rem, env(safe-area-inset-top))"
    >
      <NuxtLink
        to="/lab/screens"
        class="rounded-lg px-2 py-1.5 text-xs font-bold text-white/70 hover:bg-white/10 hover:text-white"
      >
        ← Index
      </NuxtLink>

      <div class="min-w-0 flex-1 text-center sm:text-left">
        <p class="truncate text-[10px] font-bold uppercase tracking-wider text-white/45">
          {{ neighbors.index + 1 }} / {{ neighbors.total }}
          ·
          {{ frame.width }}×{{ frame.height }}
        </p>
        <p class="truncate text-sm font-bold leading-tight">
          {{ slide.title }}
        </p>
      </div>

      <div
        class="flex rounded-xl border border-white/20 p-0.5"
        role="group"
        aria-label="Form factor"
      >
        <button
          v-for="ff in LAB_FORM_FACTORS"
          :key="ff.id"
          type="button"
          class="rounded-lg px-2.5 py-1.5 text-xs font-bold transition"
          :class="formFactor === ff.id
            ? 'bg-[var(--accent)] text-[var(--ink)]'
            : 'text-white/70 hover:bg-white/10 hover:text-white'"
          :aria-pressed="formFactor === ff.id"
          @click="setFormFactor(ff.id)"
        >
          {{ ff.label }}
        </button>
      </div>
    </header>

    <div
      ref="stageRef"
      class="flex min-h-0 flex-1 items-center justify-center overflow-hidden p-3"
    >
      <div
        class="relative"
        :style="{
          width: `${frame.width * scale}px`,
          height: `${frame.height * scale}px`,
        }"
      >
        <div
          class="absolute left-0 top-0 overflow-hidden rounded-[1.25rem] border-[3px] border-white/25 bg-[var(--paper)] shadow-[0_24px_60px_rgba(0,0,0,0.45)]"
          :style="{
            width: `${frame.width}px`,
            height: `${frame.height}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }"
        >
          <iframe
            :key="`${slide.id}-${formFactor}`"
            :src="embedSrc"
            :title="`${slide.title} — ${frame.label}`"
            class="h-full w-full border-0 bg-[var(--paper)]"
          />
        </div>
      </div>
    </div>

    <footer
      class="flex shrink-0 items-center gap-2 border-t border-white/15 px-3 py-2"
      style="padding-bottom: max(0.5rem, env(safe-area-inset-bottom))"
    >
      <button
        type="button"
        class="rounded-xl border border-white/20 px-3 py-2 text-sm font-bold text-white/80 disabled:opacity-30"
        :disabled="!neighbors.prev"
        @click="neighbors.prev && goSlide(neighbors.prev.id)"
      >
        ← Prev
      </button>
      <p class="min-w-0 flex-1 truncate text-center text-[11px] text-white/45">
        ← → slides · 1 2 3 form factor · Esc index
      </p>
      <button
        type="button"
        class="rounded-xl border border-white/20 px-3 py-2 text-sm font-bold text-white/80 disabled:opacity-30"
        :disabled="!neighbors.next"
        @click="neighbors.next && goSlide(neighbors.next.id)"
      >
        Next →
      </button>
    </footer>
  </div>
</template>
