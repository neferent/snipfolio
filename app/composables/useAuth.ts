import { SignJWT, jwtVerify } from 'jose'
import { createClient } from '@supabase/supabase-js'
import { useAuthStore } from '~/stores/auth'
import type { AuthUser } from '~/types'

const LOCAL_TOKEN_KEY = 'snipfolio_local_token'

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

  return { signIn, signOut, restoreSession }
}

function useSupabaseAuth() {
  const store = useAuthStore()
  const config = useRuntimeConfig()

  const supabase = createClient(config.public.supabaseUrl, config.public.supabaseKey)

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    if (data.user) {
      store.setUser({ id: data.user.id, email: data.user.email ?? '' })
      store.setToken(data.session?.access_token ?? null)
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    store.clear()
    await navigateTo('/')
  }

  async function restoreSession() {
    const { data } = await supabase.auth.getSession()
    if (data.session?.user) {
      store.setUser({
        id: data.session.user.id,
        email: data.session.user.email ?? '',
      })
      store.setToken(data.session.access_token)
    }
    supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        store.setUser({ id: session.user.id, email: session.user.email ?? '' })
        store.setToken(session.access_token)
      } else {
        store.clear()
      }
    })
  }

  return { signIn, signOut, restoreSession }
}

export function useAuth() {
  const config = useRuntimeConfig()
  const mode = config.public.authMode as string
  return mode === 'supabase' ? useSupabaseAuth() : useLocalAuth()
}
