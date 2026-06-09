import { useAuth } from '~/composables/useAuth'
import { useAuthStore } from '~/stores/auth'
import { initSupabaseClient } from '~/composables/useSupabaseClient'

// Runs once on the client before any page mounts.
// Populates the auth store (user, token, isPro, isAdmin) from the existing session,
// then redirects to /login if the initial SSR-rendered route requires auth.
// (The auth middleware skips during Vue hydration to prevent VDom mismatches, so
// this plugin handles the initial-load redirect instead.)
export default defineNuxtPlugin(async () => {
  const route = useRoute()
  const publicPaths = ['/', '/login', '/reset-password', '/pricing']
  const isPublic = publicPaths.includes(route.path) || route.path.startsWith('/auth/') || route.path.startsWith('/checkout/')

  // Skip Supabase init on public pages when no stored session exists.
  // Supabase stores its token under a key matching /^sb-.*-auth-token$/.
  // If there's no token, the user is definitely logged out and we avoid
  // downloading the ~200 KB Supabase bundle on marketing/public pages.
  const hasStoredSession = Object.keys(localStorage).some(
    k => k.startsWith('sb-') && k.endsWith('-auth-token'),
  )
  if (isPublic && !hasStoredSession) {
    return
  }

  await initSupabaseClient()
  const { restoreSession } = useAuth()
  await restoreSession()

  const authStore = useAuthStore()
  if (!authStore.isAuthenticated && !isPublic) {
    await navigateTo('/login')
  }
})
