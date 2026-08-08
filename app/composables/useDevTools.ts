export function useDevTools() {
  const config = useRuntimeConfig()
  const enabled = computed(() => {
    return import.meta.dev && Boolean(config.public.devInspectorKey)
  })
  return { enabled }
}
