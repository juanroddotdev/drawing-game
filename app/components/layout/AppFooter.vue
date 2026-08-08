<script setup lang="ts">
const { enabled: showDevTools } = useDevTools()
</script>

<template>
  <footer class="border-t border-slate-200/80 pt-6 text-sm text-slate-500">
    <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
      <NuxtLink
        to="/lab"
        class="font-medium text-slate-600 underline-offset-2 hover:text-slate-900 hover:underline"
      >
        Canvas lab
      </NuxtLink>
      <NuxtLink
        v-if="showDevTools"
        to="/dev"
        class="font-medium text-amber-800 underline-offset-2 hover:underline"
      >
        Dev mode
      </NuxtLink>
    </div>
    <p
      v-if="showDevTools"
      class="mt-2 text-xs text-amber-800/80"
    >
      Dev tools on — remove before launch.
    </p>
  </footer>
</template>
