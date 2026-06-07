export default defineNuxtRouteMiddleware((to) => {
  const { appEnabled } = useRuntimeConfig().public

  if (!appEnabled && to.path !== '/') {
    return navigateTo('/')
  }
})
