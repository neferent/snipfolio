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
  const publicPaths = ['/login', '/reset-password']
  const isPublic = publicPaths.includes(route.path) || route.path.startsWith('/auth/') || route.path.startsWith('/checkout/')

  // Email confirmation/recovery links redirect back to the Site URL (often "/")
  // with auth state attached: "#access_token=..." (implicit flow) or "?code=..." (PKCE).
  const hasAuthHash = window.location.hash.includes('access_token=')
  const hasAuthCode = !!route.query.code

  await initSupabaseClient()

  const { restoreSession } = useAuth()
  await restoreSession()

  const authStore = useAuthStore()

  if ((hasAuthHash || hasAuthCode) && authStore.isAuthenticated) {
    await useResumePostAuth().resume({ replace: true })
    return
  }

  // navigateTo() called here (before app.mount()) gets silently overridden by the
  // router's own initial navigation, which runs right after plugins resolve. Deferring
  // to app:mounted ensures the redirect happens after that initial navigation settles.
  if (route.path === '/') {
    const target = authStore.isAuthenticated ? '/dashboard' : '/login'
    useNuxtApp().hook('app:mounted', () => {
      navigateTo(target, { replace: true })
    })
    return
  }

  if (!authStore.isAuthenticated && !isPublic) {
    await navigateTo('/login')
  }
})
