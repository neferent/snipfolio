import { useAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return

  // Skip during hydration — server has already rendered the page; redirecting
  // mid-hydration causes a VDom/DOM mismatch. The auth.client plugin restores
  // the session before the app mounts, so any route visited while unauthenticated
  // will be caught on the next non-hydration navigation.
  const nuxtApp = useNuxtApp()
  if (nuxtApp.isHydrating) return

  const authStore = useAuthStore()
  const publicRoutes = ['/', '/login']

  if (!authStore.isAuthenticated && !publicRoutes.includes(to.path)) {
    return navigateTo('/login')
  }
})
