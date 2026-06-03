import { defineStore } from 'pinia'
import type { AuthUser } from '~/types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const token = ref<string | null>(null)
  const isLoading = ref(false)

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

  function clear() {
    user.value = null
    token.value = null
  }

  return { user, token, isLoading, isAuthenticated, setUser, setToken, setLoading, clear }
})
