<script setup lang="ts">
import type { DrawingDocument } from '~/types/stroke'

const open = defineModel<boolean>('open', { required: true })
const nickname = defineModel<string>('nickname', { required: true })
const email = defineModel<string>('email', { required: true })

const props = withDefaults(defineProps<{
  title?: string
  confirmLabel?: string
  busy?: boolean
  /** When set with strokes, show tilted sketch preview at top of sheet. */
  preview?: DrawingDocument | null
}>(), {
  title: 'Who’s playing?',
  confirmLabel: 'Continue',
  busy: false,
  preview: null,
})

const emit = defineEmits<{
  confirm: []
}>()

const localError = ref('')

const hasPreview = computed(
  () => Boolean(props.preview && props.preview.strokes.length > 0),
)

watch(open, (isOpen) => {
  if (isOpen) {
    localError.value = ''
  }
})

function close() {
  if (props.busy) return
  open.value = false
  localError.value = ''
}

function onConfirm() {
  localError.value = ''
  if (!nickname.value.trim()) {
    localError.value = 'Add a nickname.'
    return
  }
  emit('confirm')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="submit-sheet">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-end justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:items-center sm:p-4"
      >
        <button
          type="button"
          class="submit-sheet__backdrop absolute inset-0 bg-[var(--ink)]/45"
          aria-label="Close"
          @click="close"
        />
        <div
          class="panel-sketch submit-sheet__panel relative z-10 w-full max-w-lg rounded-[var(--radius-panel)] p-5"
          role="dialog"
          aria-modal="true"
        >
          <h2 class="text-lg font-bold tracking-tight text-[var(--ink)]">
            {{ title }}
          </h2>
          <p class="mt-1 text-sm text-[var(--ink-muted)]">
            We’ll remember this on this device.
          </p>

          <div
            v-if="hasPreview && preview"
            class="mt-4 flex justify-center py-2"
          >
            <div
              class="sketch-preview w-[9.5rem] overflow-hidden border border-[var(--ink)] bg-[var(--canvas)] shadow-block sm:w-[10.5rem]"
              aria-hidden="true"
            >
              <CanvasStrokeRenderer
                :document="preview"
                bare
              />
            </div>
          </div>

          <label class="mt-4 block space-y-2">
            <span class="text-sm font-bold text-[var(--ink)]">Nickname</span>
            <input
              v-model="nickname"
              type="text"
              maxlength="32"
              class="chip-sketch w-full rounded-[var(--radius-chip)] px-3 py-3 text-base text-[var(--ink)] outline-none placeholder:text-[var(--ink-muted)] focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-[var(--ink)]"
              placeholder="Alex"
              autocomplete="nickname"
            >
          </label>

          <label class="mt-4 block space-y-2">
            <span class="text-sm font-bold text-[var(--ink)]">
              Email <span class="font-medium text-[var(--ink-muted)]">(optional)</span>
            </span>
            <input
              v-model="email"
              type="email"
              class="chip-sketch w-full rounded-[var(--radius-chip)] px-3 py-3 text-base text-[var(--ink)] outline-none placeholder:text-[var(--ink-muted)] focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-[var(--ink)]"
              placeholder="you@example.com"
              autocomplete="email"
            >
            <span class="block text-sm font-medium text-[var(--ink-muted)]">
              We’ll email you the final reveal when this loop ends.
            </span>
          </label>

          <p
            v-if="localError"
            class="mt-3 border border-[var(--ink)] bg-[var(--toast-alert)] px-3 py-2 text-sm font-semibold text-[var(--ink)] shadow-block"
            role="alert"
          >
            {{ localError }}
          </p>

          <div class="mt-5 flex items-center gap-2">
            <button
              type="button"
              class="btn-quiet flex-1 !py-3 text-sm disabled:opacity-50"
              :disabled="busy"
              @click="close"
            >
              Cancel
            </button>
            <button
              type="button"
              class="btn-accent flex-[1.4] !py-3 text-sm disabled:opacity-50"
              :disabled="busy"
              @click="onConfirm"
            >
              {{ busy ? 'Working…' : confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.sketch-preview {
  transform: rotate(-2deg);
}

.submit-sheet-enter-active,
.submit-sheet-leave-active {
  transition: opacity 0.22s ease;
}

.submit-sheet-enter-active .submit-sheet__panel,
.submit-sheet-leave-active .submit-sheet__panel {
  transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1);
}

.submit-sheet-enter-from,
.submit-sheet-leave-to {
  opacity: 0;
}

.submit-sheet-enter-from .submit-sheet__panel,
.submit-sheet-leave-to .submit-sheet__panel {
  transform: translateY(1.25rem);
}

@media (min-width: 640px) {
  .submit-sheet-enter-from .submit-sheet__panel,
  .submit-sheet-leave-to .submit-sheet__panel {
    transform: translateY(0.75rem) scale(0.98);
  }
}
</style>
