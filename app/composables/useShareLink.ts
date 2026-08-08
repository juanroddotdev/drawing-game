export function useShareLink() {
  const copied = ref(false)
  const shareError = ref('')
  const canNativeShare = computed(() => import.meta.client && typeof navigator !== 'undefined' && !!navigator.share)

  async function copyText(text: string) {
    copied.value = false
    shareError.value = ''
    try {
      await navigator.clipboard.writeText(text)
      copied.value = true
    }
    catch {
      shareError.value = 'Could not copy — select the link manually.'
    }
  }

  async function shareOrCopy(input: { title: string, text: string, url: string }) {
    shareError.value = ''
    if (canNativeShare.value) {
      try {
        await navigator.share(input)
        return
      }
      catch {
        /* cancelled or failed — fall through to copy */
      }
    }
    await copyText(input.url)
  }

  function mailtoShare(url: string, stepLabel: string) {
    const subject = encodeURIComponent('Your turn on PenPass')
    const body = encodeURIComponent(`You're up for ${stepLabel}.\n\n${url}\n`)
    return `mailto:?subject=${subject}&body=${body}`
  }

  return {
    copied,
    shareError,
    canNativeShare,
    copyText,
    shareOrCopy,
    mailtoShare,
  }
}
