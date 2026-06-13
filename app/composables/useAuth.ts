import { useAuthStore } from '~/stores/auth'
import { toast } from '~/composables/useToast'
import { initSupabaseClient } from '~/composables/useSupabaseClient'

let _authListenerRegistered = false

// Distinguishes transient network failures (Supabase unreachable, offline) from
// genuine auth errors (bad credentials, expired link) so the UI can suggest
// the right next step.
export function getAuthErrorMessage(e: unknown, fallback: string): string {
  if (e instanceof Error) {
    const name = e.name
    const msg = e.message.toLowerCase()
    if (name === 'AuthRetryableFetchError' || msg.includes('fetch') || msg.includes('network')) {
      return 'Network error — check your connection and try again.'
    }
    return e.message
  }
  return fallback
}

function useSupabaseAuth() {
  const store = useAuthStore()

  async function loadProfile(_userId: string) {
    const token = store.token
    if (!token) return
    try {
      const profile = await $fetch<{ isPro: boolean; isAdmin: boolean; proExpiresAt: string | null }>('/api/me/profile', {
        headers: { Authorization: `Bearer ${token}` },
      })
      store.setProfile(profile.isPro, profile.isAdmin, profile.proExpiresAt)
    } catch (e) {
      console.warn('[loadProfile] error:', e)
      toast.error('Could not load your profile. Some features may be unavailable — try refreshing.')
    }
  }

  async function signIn(email: string, password: string) {
    await initSupabaseClient()
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
    await initSupabaseClient()
    const supabase = useSupabaseClient()
    if (!supabase) throw new Error('Supabase is not configured')
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
    })
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
    await initSupabaseClient()
    const supabase = useSupabaseClient()
    if (supabase) await supabase.auth.signOut()
    store.clear()
    await navigateTo('/login')
  }

  async function sendPasswordReset(email: string) {
    await initSupabaseClient()
    const supabase = useSupabaseClient()
    if (!supabase) throw new Error('Supabase is not configured')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm`,
    })
    if (error) throw error
  }

  async function updatePassword(newPassword: string) {
    await initSupabaseClient()
    const supabase = useSupabaseClient()
    if (!supabase) throw new Error('Supabase is not configured')
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
  }

  async function refreshProfile() {
    const userId = store.user?.id
    if (!userId || store.isGuest) return
    await loadProfile(userId)
  }

  async function restoreSession() {
    await initSupabaseClient()
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
      supabase.auth.onAuthStateChange(async (_event: string, session: { user: { id: string; email?: string }; access_token: string } | null) => {
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

  return { signIn, signUp, signOut, restoreSession, refreshProfile, sendPasswordReset, updatePassword }
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
