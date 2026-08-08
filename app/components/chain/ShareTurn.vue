<script setup lang="ts">
const props = defineProps<{
  url: string
  stepLabel: string
  slug: string
}>()

const { copied, shareError, canNativeShare, copyText, shareOrCopy, mailtoShare } = useShareLink()
const moreOpen = ref(false)

const mailHref = computed(() => mailtoShare(props.url, props.stepLabel))
</script>

<template>
  <div class="space-y-4">
    <button
      type="button"
      class="flex w-full items-center justify-center rounded-2xl bg-slate-900 px-4 py-4 text-base font-semibold text-white shadow-sm"
      @click="shareOrCopy({ title: 'DoodleLoop — your turn', text: `You're up for ${stepLabel}`, url })"
    >
      {{ canNativeShare ? 'Share turn' : 'Copy link to share' }}
    </button>

    <div class="flex items-start gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <p class="min-w-0 flex-1 break-all font-mono text-xs leading-relaxed text-slate-700">
        {{ url || '…' }}
      </p>
      <button
        type="button"
        class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-300 text-xs font-semibold text-slate-800"
        aria-label="Copy link"
        @click="copyText(url)"
      >
        {{ copied ? '✓' : 'Copy' }}
      </button>
    </div>

    <p
      v-if="shareError"
      class="text-sm text-red-600"
    >
      {{ shareError }}
    </p>

    <div>
      <button
        type="button"
        class="text-sm font-semibold text-slate-600 underline-offset-2 hover:underline"
        @click="moreOpen = !moreOpen"
      >
        {{ moreOpen ? 'Hide more' : 'More' }}
      </button>
      <div
        v-if="moreOpen"
        class="mt-3 flex flex-col gap-2"
      >
        <a
          :href="mailHref"
          class="rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-800"
        >
          Email link
        </a>
        <NuxtLink
          :to="`/c/${slug}`"
          class="rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-800"
        >
          Chain status
        </NuxtLink>
        <NuxtLink
          :to="`/c/${slug}/reveal`"
          class="rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-800"
        >
          Reveal
        </NuxtLink>
      </div>
    </div>

    <p class="text-xs text-slate-500">
      Anyone with this link can take the next seat. Don’t post it publicly forever.
    </p>
  </div>
</template>
