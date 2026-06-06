import { defineStore } from 'pinia'
import type { AuthUser } from '~/types'

const GUEST_ID_KEY = 'snipfolio_guest_id'
const GUEST_FLAG_KEY = 'snipfolio_is_guest'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const token = ref<string | null>(null)
  const isLoading = ref(false)
  const isGuest = ref(false)

  const isAuthenticated = computed(() => user.value !== null)

  function setUser(u: AuthUser | null) {
    user.value = u
  }

  function setToken(t: string | null) {
    token.value = t
  }

  function setLoading(v: boolean) {
    isLoading.value = v
  }

  function setGuest() {
    if (!import.meta.client) return
    let guestId = localStorage.getItem(GUEST_ID_KEY)
    if (!guestId) {
      guestId = crypto.randomUUID()
      localStorage.setItem(GUEST_ID_KEY, guestId)
    }
    localStorage.setItem(GUEST_FLAG_KEY, '1')
    user.value = { id: guestId, email: '' }
    isGuest.value = true
  }

  function restoreGuest(): boolean {
    if (!import.meta.client) return false
    const wasGuest = localStorage.getItem(GUEST_FLAG_KEY)
    const guestId = localStorage.getItem(GUEST_ID_KEY)
    if (wasGuest && guestId) {
      user.value = { id: guestId, email: '' }
      isGuest.value = true
      return true
    }
    return false
  }

  function clear() {
    user.value = null
    token.value = null
    isGuest.value = false
    if (import.meta.client) localStorage.removeItem(GUEST_FLAG_KEY)
  }

  return { user, token, isLoading, isAuthenticated, isGuest, setUser, setToken, setLoading, setGuest, restoreGuest, clear }
})
