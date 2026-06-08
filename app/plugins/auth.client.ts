import { useAuth } from '~/composables/useAuth'
import { useAuthStore } from '~/stores/auth'

// Runs once on the client before any page mounts.
// Populates the auth store (user, token, isPro, isAdmin) from the existing session,
// then redirects to /login if the initial SSR-rendered route requires auth.
// (The auth middleware skips during Vue hydration to prevent VDom mismatches, so
// this plugin handles the initial-load redirect instead.)
export default defineNuxtPlugin(async () => {
  const { restoreSession } = useAuth()
  await restoreSession()

  const authStore = useAuthStore()
  const route = useRoute()
  const publicPaths = ['/', '/login', '/reset-password']
  const isPublic = publicPaths.includes(route.path) || route.path.startsWith('/auth/')

  if (!authStore.isAuthenticated && !isPublic) {
    await navigateTo('/login')
  }
})
