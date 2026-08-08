<script setup lang="ts">
const open = defineModel<boolean>('open', { required: true })
const nickname = defineModel<string>('nickname', { required: true })
const email = defineModel<string>('email', { required: true })

const props = withDefaults(defineProps<{
  title?: string
  confirmLabel?: string
  busy?: boolean
}>(), {
  title: 'Who’s playing?',
  confirmLabel: 'Continue',
  busy: false,
})

const emit = defineEmits<{
  confirm: []
}>()

const localError = ref('')
const showEmail = ref(false)

watch(open, (isOpen) => {
  if (isOpen) {
    localError.value = ''
    showEmail.value = Boolean(email.value.trim())
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
  if (!showEmail.value) {
    email.value = ''
  }
  emit('confirm')
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
    >
      <button
        type="button"
        class="absolute inset-0 bg-slate-900/40"
        aria-label="Close"
        @click="close"
      />
      <div
        class="relative z-10 w-full max-w-lg rounded-t-2xl border border-slate-200 bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-xl sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
      >
        <h2 class="text-lg font-bold tracking-tight text-slate-900">
          {{ title }}
        </h2>
        <p class="mt-1 text-sm text-slate-500">
          We’ll remember this on this device.
        </p>

        <label class="mt-4 block space-y-2">
          <span class="text-sm font-medium text-slate-700">Nickname</span>
          <input
            v-model="nickname"
            type="text"
            maxlength="32"
            class="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base"
            placeholder="Alex"
            autocomplete="nickname"
          >
        </label>

        <button
          type="button"
          class="mt-3 text-sm font-semibold text-slate-600 underline-offset-2 hover:underline"
          @click="showEmail = !showEmail"
        >
          {{ showEmail ? 'Hide email' : 'Add email (optional)' }}
        </button>

        <label
          v-if="showEmail"
          class="mt-2 block space-y-2"
        >
          <span class="text-sm font-medium text-slate-700">Email</span>
          <input
            v-model="email"
            type="email"
            class="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base"
            placeholder="you@example.com"
            autocomplete="email"
          >
        </label>

        <p
          v-if="localError"
          class="mt-3 text-sm text-red-600"
        >
          {{ localError }}
        </p>

        <div class="mt-5 flex gap-2">
          <button
            type="button"
            class="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700"
            :disabled="busy"
            @click="close"
          >
            Cancel
          </button>
          <button
            type="button"
            class="flex-1 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
            :disabled="busy"
            @click="onConfirm"
          >
            {{ busy ? 'Working…' : confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
