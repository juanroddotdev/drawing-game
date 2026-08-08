<script setup lang="ts">
useHead({ title: 'DoodleLoop' })
</script>

<template>
  <main class="min-h-dvh bg-gradient-to-b from-slate-100 to-slate-200 px-4 py-16 text-slate-900">
    <div class="mx-auto flex max-w-lg flex-col gap-8">
      <header class="space-y-3">
        <p class="text-sm font-semibold uppercase tracking-wide text-slate-500">
          DoodleLoop
        </p>
        <h1 class="text-4xl font-bold tracking-tight">
          Draw. Pass. Guess. Repeat.
        </h1>
        <p class="text-slate-600">
          Async telephone with friends — share a link, pass the turn, reveal the chaos.
        </p>
      </header>

      <UiPhoneTip />

      <div class="flex flex-wrap gap-3">
        <NuxtLink
          to="/play/new"
          class="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
        >
          Start a loop
        </NuxtLink>
        <NuxtLink
          to="/lab"
          class="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold"
        >
          Canvas lab
        </NuxtLink>
      </div>
    </div>
  </main>
</template>
