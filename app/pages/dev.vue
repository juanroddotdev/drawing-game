<script setup lang="ts">
const { enabled: showDevTools } = useDevTools()

useHead({ title: 'Dev mode — DoodleLoop' })

if (!showDevTools.value) {
  await navigateTo('/')
}
</script>

<template>
  <main class="min-h-dvh bg-slate-950 px-4 py-10 text-slate-100">
    <div class="mx-auto flex max-w-lg flex-col gap-6">
      <div class="rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
        <!-- LAUNCH: delete this page (and footer Dev mode link) before public launch. -->
        Temporary for closed beta. Remove Dev mode before launch.
      </div>

      <header class="space-y-2">
        <p class="text-xs font-semibold uppercase tracking-wide text-amber-400">
          Dev mode
        </p>
        <h1 class="text-2xl font-bold tracking-tight">
          Solo-test without pasting links
        </h1>
        <p class="text-sm leading-relaxed text-slate-400">
          Start a loop, then on the Pass screen tap
          <span class="font-semibold text-amber-200">Play next myself</span>
          to claim the next seat. Same button appears on chain status when Dev tools are on.
        </p>
      </header>

      <ol class="list-decimal space-y-2 pl-5 text-sm text-slate-300">
        <li>Create a loop as usual.</li>
        <li>On Pass, use the amber dashed <strong>Play next myself</strong> control.</li>
        <li>Or open <code class="rounded bg-slate-800 px-1 py-0.5 text-xs">/c/&lt;slug&gt;/dev</code> for the full inspector.</li>
      </ol>

      <div class="flex flex-col gap-3 pt-2">
        <NuxtLink
          to="/play/new"
          class="rounded-2xl bg-amber-500 px-4 py-3 text-center text-sm font-semibold text-slate-950"
        >
          Start a loop
        </NuxtLink>
        <NuxtLink
          to="/lab"
          class="rounded-2xl border border-slate-600 px-4 py-3 text-center text-sm font-semibold text-slate-200"
        >
          Canvas lab
        </NuxtLink>
        <NuxtLink
          to="/lab/screens"
          class="rounded-2xl border border-slate-600 px-4 py-3 text-center text-sm font-semibold text-slate-200"
        >
          Screen lab
        </NuxtLink>
        <NuxtLink
          to="/"
          class="text-center text-sm text-slate-500 underline-offset-2 hover:underline"
        >
          ← Home
        </NuxtLink>
      </div>
    </div>
  </main>
</template>
