<script setup lang="ts">
const props = withDefaults(defineProps<{
  message: string
  /** Soft coral for errors; yellow for tips. */
  tone?: 'note' | 'alert'
  /** 0 disables auto-dismiss (use for confirm prompts). */
  autoDismissMs?: number
  confirmLabel?: string
  cancelLabel?: string
}>(), {
  tone: 'note',
  autoDismissMs: 4000,
  confirmLabel: '',
  cancelLabel: 'Cancel',
})

const emit = defineEmits<{
  dismiss: []
  confirm: []
}>()

const isConfirm = computed(() => Boolean(props.confirmLabel))

let timer: ReturnType<typeof setTimeout> | null = null

function clearTimer() {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
}

function scheduleDismiss() {
  clearTimer()
  if (!props.message || props.autoDismissMs <= 0 || isConfirm.value) return
  timer = setTimeout(() => {
    emit('dismiss')
  }, props.autoDismissMs)
}

watch(
  () => [props.message, props.confirmLabel, props.autoDismissMs] as const,
  () => scheduleDismiss(),
  { immediate: true },
)

onBeforeUnmount(clearTimer)
</script>

<template>
  <Transition name="sketch-toast">
    <div
      v-if="message"
      role="status"
      class="sketch-toast pointer-events-auto w-full max-w-[min(100%,20rem)] border border-[var(--ink)] px-3 py-2.5 text-sm font-semibold leading-snug text-[var(--ink)] shadow-block"
      :class="tone === 'alert' ? 'bg-[var(--toast-alert)]' : 'bg-[var(--toast-note)]'"
    >
      <p>{{ message }}</p>
      <div
        v-if="isConfirm"
        class="mt-2.5 flex gap-2"
      >
        <button
          type="button"
          class="flex-1 border border-[var(--ink)] bg-[var(--surface)] px-2 py-1.5 text-xs font-bold shadow-block"
          @click="emit('dismiss')"
        >
          {{ cancelLabel }}
        </button>
        <button
          type="button"
          class="flex-1 border border-[var(--ink)] bg-[var(--ink)] px-2 py-1.5 text-xs font-bold text-white shadow-block"
          @click="emit('confirm')"
        >
          {{ confirmLabel }}
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.sketch-toast {
  transform: rotate(-1.5deg);
}

.sketch-toast-enter-active,
.sketch-toast-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s ease;
}

.sketch-toast-enter-from,
.sketch-toast-leave-to {
  opacity: 0;
  transform: rotate(-1.5deg) translateY(-0.6rem);
}
</style>
