import { useAuth } from '~/composables/useAuth'
import { useAuthStore } from '~/stores/auth'
import { initSupabaseClient } from '~/composables/useSupabaseClient'
import { useResumePostAuth } from '~/composables/useResumePostAuth'

// Runs once on the client before any page mounts.
// Populates the auth store (user, token, isPro, isAdmin) from the existing session,
// then redirects to /login if the initial SSR-rendered route requires auth.
// (The auth middleware skips during Vue hydration to prevent VDom mismatches, so
// this plugin handles the initial-load redirect instead.)
export default defineNuxtPlugin(async () => {
  const route = useRoute()
  const publicPaths = ['/', '/login', '/reset-password', '/pricing']
  const isPublic = publicPaths.includes(route.path) || route.path.startsWith('/auth/') || route.path.startsWith('/checkout/')

  // Pages where Supabase is needed even for logged-out users (sign in/up forms,
  // password reset, auth callback handlers, checkout return).
  const alwaysNeedsSupabase = route.path === '/login' || route.path === '/reset-password'
    || route.path.startsWith('/auth/') || route.path.startsWith('/checkout/')

  // Skip Supabase init on purely static marketing pages when no stored session exists.
  // Supabase stores its token under a key matching /^sb-.*-auth-token$/.
  // If there's no token, the user is definitely logged out and we avoid
  // downloading the ~200 KB Supabase bundle on marketing pages.
  const hasStoredSession = Object.keys(localStorage).some(
    k => k.startsWith('sb-') && k.endsWith('-auth-token'),
  )

  // Email confirmation/recovery links redirect back to the Site URL (often "/")
  // with auth state attached: "#access_token=..." (implicit flow) or "?code=..." (PKCE).
  // Detect these so we still initialize Supabase and pick up the new session.
  const hasAuthHash = window.location.hash.includes('access_token=')
  const hasAuthCode = !!route.query.code

  if (isPublic && !alwaysNeedsSupabase && !hasStoredSession && !hasAuthHash && !hasAuthCode) {
    return
  }

  // Supabase's client, on init, auto-detects "#access_token=..." and "?code=..."
  // in the URL (detectSessionInUrl) and establishes the session before getSession()
  // resolves — so no manual exchange is needed here.
  await initSupabaseClient()

  const { restoreSession } = useAuth()
  await restoreSession()

  const authStore = useAuthStore()

  if ((hasAuthHash || hasAuthCode) && authStore.isAuthenticated) {
    await useResumePostAuth().resume({ replace: true })
    return
  }

  if (!authStore.isAuthenticated && !isPublic) {
    await navigateTo('/login')
  }
})
