import { useAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return

  const authStore = useAuthStore()
  const publicRoutes = ['/', '/login']

  if (!authStore.isAuthenticated && !publicRoutes.includes(to.path)) {
    return navigateTo('/login')
  }
})
