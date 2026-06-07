import { SignJWT, jwtVerify } from 'jose'
import { useAuthStore } from '~/stores/auth'

const LOCAL_TOKEN_KEY = 'snipfolio_local_token'

// Track whether the auth state listener has been registered so we never double-register
let _authListenerRegistered = false

function useLocalAuth() {
  const store = useAuthStore()
  const config = useRuntimeConfig()

  async function signIn(email: string, password: string) {
    if (email !== config.public.localDevEmail || password !== config.public.localDevPassword) {
      throw new Error('Invalid credentials')
    }
    const secret = new TextEncoder().encode(config.public.localJwtSecret)
    const token = await new SignJWT({ email, sub: 'local-dev-user' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(secret)

    if (import.meta.client) localStorage.setItem(LOCAL_TOKEN_KEY, token)
    store.setUser({ id: 'local-dev-user', email })
    store.setToken(token)
  }

  async function signUp(email: string, password: string) {
    await signIn(email, password)
  }

  async function signOut() {
    if (import.meta.client) localStorage.removeItem(LOCAL_TOKEN_KEY)
    store.clear()
    await navigateTo('/')
  }

  async function restoreSession() {
    if (!import.meta.client) return
    const token = localStorage.getItem(LOCAL_TOKEN_KEY)
    if (!token) return
    try {
      const secret = new TextEncoder().encode(config.public.localJwtSecret)
      const { payload } = await jwtVerify(token, secret)
      store.setUser({ id: payload.sub as string, email: payload.email as string })
      store.setToken(token)
    } catch {
      localStorage.removeItem(LOCAL_TOKEN_KEY)
    }
  }

  async function refreshProfile() { /* no-op in local mode */ }

  return { signIn, signUp, signOut, restoreSession, refreshProfile }
}

function useSupabaseAuth() {
  const store = useAuthStore()
  const supabase = useSupabaseClient()

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
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    if (data.user) {
      store.setUser({ id: data.user.id, email: data.user.email ?? '' })
      store.setToken(data.session?.access_token ?? null)
      await loadProfile(data.user.id)
    }
  }

  async function signUp(email: string, password: string) {
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
    await supabase.auth.signOut()
    store.clear()
    await navigateTo('/')
  }

  // Re-fetch profile from DB and update the store — use this when flags may have changed
  async function refreshProfile() {
    const userId = store.user?.id
    if (!userId || store.isGuest) return
    await loadProfile(userId)
  }

  async function restoreSession() {
    const { data } = await supabase.auth.getSession()
    if (data.session?.user) {
      store.setUser({
        id: data.session.user.id,
        email: data.session.user.email ?? '',
      })
      store.setToken(data.session.access_token)
      await loadProfile(data.session.user.id)
    }

    // Register the auth state listener exactly once for the lifetime of the app
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
  const config = useRuntimeConfig()
  const mode = config.public.authMode as string
  const impl = mode === 'supabase' ? useSupabaseAuth() : useLocalAuth()
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
