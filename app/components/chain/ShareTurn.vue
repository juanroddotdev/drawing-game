<script setup lang="ts">
const props = defineProps<{
  url: string
  stepLabel: string
  slug: string
}>()

const { copied, shareError, canNativeShare, copyText, shareOrCopy, mailtoShare } = useShareLink()

const mailHref = computed(() => mailtoShare(props.url, props.stepLabel))
</script>

<template>
  <div class="space-y-4">
    <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Pass-turn link
      </p>
      <p class="break-all font-mono text-xs text-slate-700">
        {{ url || '…' }}
      </p>
    </div>

    <div class="flex flex-wrap gap-2">
      <button
        type="button"
        class="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
        @click="shareOrCopy({ title: 'DoodleLoop — your turn', text: `You're up for ${stepLabel}`, url })"
      >
        {{ canNativeShare ? 'Share' : 'Copy link' }}
      </button>
      <button
        type="button"
        class="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold"
        @click="copyText(url)"
      >
        {{ copied ? 'Copied!' : 'Copy link' }}
      </button>
      <a
        :href="mailHref"
        class="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold"
      >
        Email link
      </a>
      <NuxtLink
        :to="`/c/${slug}`"
        class="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold"
      >
        Chain status
      </NuxtLink>
      <NuxtLink
        :to="`/c/${slug}/reveal`"
        class="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold"
      >
        Reveal
      </NuxtLink>
    </div>

    <p
      v-if="shareError"
      class="text-sm text-red-600"
    >
      {{ shareError }}
    </p>

    <p class="text-xs text-slate-500">
      Anyone with this link can take the next seat. Don’t post it publicly forever.
      Automated turn emails come later — use Share / Email link for now.
    </p>
  </div>
</template>
