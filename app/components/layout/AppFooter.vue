<script setup lang="ts">
const { enabled: showDevTools } = useDevTools()
const isDev = import.meta.dev
const open = ref(false)
const root = ref<HTMLElement | null>(null)

function toggle() {
  open.value = !open.value
}

function close() {
  open.value = false
}

function onDocPointer(e: PointerEvent) {
  if (!open.value || !root.value) return
  if (!root.value.contains(e.target as Node)) {
    close()
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocPointer)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocPointer)
})
</script>

<template>
  <footer
    ref="root"
    class="relative flex justify-end pt-6"
  >
    <div class="relative">
      <button
        type="button"
        class="chip-sketch flex h-11 w-11 items-center justify-center rounded-xl text-[var(--ink)] transition hover:bg-[var(--paper)]"
        :aria-expanded="open"
        aria-haspopup="menu"
        aria-label="More options"
        @click="toggle"
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
          <circle
            cx="12"
            cy="12"
            r="3"
          />
          <path d="M12 2v2.5M12 19.5V22M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M2 12h2.5M19.5 12H22M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77" />
        </svg>
      </button>

      <div
        v-if="open"
        role="menu"
        class="panel-sketch absolute bottom-full right-0 z-20 mb-2 min-w-[11rem] overflow-hidden py-1"
      >
        <NuxtLink
          to="/lab"
          role="menuitem"
          class="block px-4 py-3 text-sm font-medium text-slate-800 hover:bg-slate-50"
          @click="close"
        >
          Canvas lab
        </NuxtLink>
        <NuxtLink
          v-if="isDev"
          to="/lab/screens"
          role="menuitem"
          class="block px-4 py-3 text-sm font-medium text-slate-800 hover:bg-slate-50"
          @click="close"
        >
          Screen lab
        </NuxtLink>
        <NuxtLink
          v-if="showDevTools"
          to="/dev"
          role="menuitem"
          class="block px-4 py-3 text-sm font-medium text-amber-900 hover:bg-amber-50"
          @click="close"
        >
          Dev mode
        </NuxtLink>
        <p
          v-if="showDevTools"
          class="border-t border-slate-100 px-4 py-2 text-[11px] leading-snug text-amber-800/80"
        >
          Dev tools on — remove before launch.
        </p>
      </div>
    </div>
  </footer>
</template>
