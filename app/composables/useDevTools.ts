export function useDevTools() {
  const config = useRuntimeConfig()
  // LAUNCH: re-gate to `import.meta.dev && …` (or delete Dev mode) before public launch.
  // Closed beta: any build with NUXT_PUBLIC_DEV_INSPECTOR_KEY shows Play next / inspector.
  const enabled = computed(() => Boolean(config.public.devInspectorKey))
  return { enabled }
}
