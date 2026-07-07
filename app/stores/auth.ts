import { defineStore } from 'pinia'
import type { AuthUser } from '~/types'

const GUEST_ID_KEY = 'snipfolio_guest_id'
const GUEST_FLAG_KEY = 'snipfolio_is_guest'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const token = ref<string | null>(null)
  const isLoading = ref(false)
  const isGuest = ref(false)
  const isPro = ref(false)
  const isAdmin = ref(false)
  const proExpiresAt = ref<string | null>(null)
  const profileLoaded = ref(false)
  const captureLimit = ref(0)
  const capturesUsed = ref(0)
  const capturesRemaining = ref(0)

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

  function setProfile(
    pro: boolean,
    admin: boolean,
    expiresAt: string | null = null,
    limit = 0,
    used = 0,
    remaining = 0,
  ) {
    isPro.value = pro
    isAdmin.value = admin
    proExpiresAt.value = expiresAt
    captureLimit.value = limit
    capturesUsed.value = used
    capturesRemaining.value = remaining
    profileLoaded.value = true
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
    isPro.value = false
    isAdmin.value = false
    proExpiresAt.value = null
    profileLoaded.value = false
    captureLimit.value = 0
    capturesUsed.value = 0
    capturesRemaining.value = 0
    if (import.meta.client) localStorage.removeItem(GUEST_FLAG_KEY)
  }

  return {
    user, token, isLoading, isAuthenticated, isGuest, isPro, isAdmin, proExpiresAt, profileLoaded,
    captureLimit, capturesUsed, capturesRemaining,
    setUser, setToken, setLoading, setProfile, setGuest, restoreGuest, clear,
  }
})
