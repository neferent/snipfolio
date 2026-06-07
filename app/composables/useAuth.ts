import { useAuthStore } from '~/stores/auth'

let _authListenerRegistered = false

function useSupabaseAuth() {
  const store = useAuthStore()

  async function loadProfile(_userId: string) {
    const token = store.token
    if (!token) return
    try {
      const profile = await $fetch<{ isPro: boolean; isAdmin: boolean }>('/api/me/profile', {
        headers: { Authorization: `Bearer ${token}` },
      })
      store.setProfile(profile.isPro, profile.isAdmin)
    } catch (e) {
      console.warn('[loadProfile] error:', e)
    }
  }

  async function signIn(email: string, password: string) {
    const supabase = useSupabaseClient()
    if (!supabase) throw new Error('Supabase is not configured')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    if (data.user) {
      store.setUser({ id: data.user.id, email: data.user.email ?? '' })
      store.setToken(data.session?.access_token ?? null)
      await loadProfile(data.user.id)
    }
  }

  async function signUp(email: string, password: string) {
    const supabase = useSupabaseClient()
    if (!supabase) throw new Error('Supabase is not configured')
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    if (data.user && data.session) {
      store.setUser({ id: data.user.id, email: data.user.email ?? '' })
      store.setToken(data.session.access_token)
      await loadProfile(data.user.id)
    } else if (data.user && !data.session) {
      throw new Error('Check your email to confirm your account.')
    }
  }

  async function signOut() {
    const supabase = useSupabaseClient()
    if (supabase) await supabase.auth.signOut()
    store.clear()
    await navigateTo('/')
  }

  async function refreshProfile() {
    const userId = store.user?.id
    if (!userId || store.isGuest) return
    await loadProfile(userId)
  }

  async function restoreSession() {
    const supabase = useSupabaseClient()
    if (!supabase) return

    const { data } = await supabase.auth.getSession()
    if (data.session?.user) {
      store.setUser({
        id: data.session.user.id,
        email: data.session.user.email ?? '',
      })
      store.setToken(data.session.access_token)
      await loadProfile(data.session.user.id)
    }

    if (!_authListenerRegistered) {
      _authListenerRegistered = true
      supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          store.setUser({ id: session.user.id, email: session.user.email ?? '' })
          store.setToken(session.access_token)
          await loadProfile(session.user.id)
        } else {
          store.clear()
        }
      })
    }
  }

  return { signIn, signUp, signOut, restoreSession, refreshProfile }
}

export function useAuth() {
  const impl = useSupabaseAuth()
  const store = useAuthStore()

  async function restoreSession() {
    await impl.restoreSession()
    if (!store.isAuthenticated) store.restoreGuest()
  }

  async function continueAsGuest() {
    store.setGuest()
    await navigateTo('/dashboard')
  }

  return { ...impl, restoreSession, continueAsGuest }
}
