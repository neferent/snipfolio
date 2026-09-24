import { defineStore } from 'pinia'
import type { AuthUser } from '~/types'

// Snipfolio-local is a purely local, single-user desktop app — there's no
// sign-in, so this store just holds a stable local "user" id (used as
// Project.userId) rather than any real auth/session state.
const LOCAL_USER_ID_KEY = 'snipfolio_local_user_id'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)

  const isAuthenticated = computed(() => user.value !== null)

  function ensureLocalUser() {
    if (user.value) return
    if (!import.meta.client) return
    let id = localStorage.getItem(LOCAL_USER_ID_KEY)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(LOCAL_USER_ID_KEY, id)
    }
    user.value = { id, email: '' }
  }

  return { user, isAuthenticated, ensureLocalUser }
})
