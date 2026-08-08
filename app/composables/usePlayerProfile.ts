const PLAYER_KEY = 'penpass.player'

export type SavedPlayer = {
  nickname: string
  email: string
}

export function usePlayerProfile() {
  const nickname = ref('')
  const email = ref('')

  function load() {
    if (!import.meta.client) return
    try {
      const raw = localStorage.getItem(PLAYER_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as SavedPlayer
      nickname.value = parsed.nickname || ''
      email.value = parsed.email || ''
    }
    catch {
      /* ignore */
    }
  }

  function save() {
    if (!import.meta.client) return
    localStorage.setItem(PLAYER_KEY, JSON.stringify({
      nickname: nickname.value.trim(),
      email: email.value.trim().toLowerCase(),
    } satisfies SavedPlayer))
  }

  onMounted(load)

  return { nickname, email, load, save }
}
