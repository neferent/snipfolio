import { useAuthStore } from '~/stores/auth'
import { toast } from '~/composables/useToast'
import { setPostAuthRedirect } from '~/composables/usePostAuthRedirect'

/** Appends a query param to the current URL so checkout success can reopen the modal the user left. */
export function checkoutReturnUrl(query: string) {
  const route = useRoute()
  const separator = route.fullPath.includes('?') ? '&' : '?'
  return `${route.fullPath}${separator}${query}`
}

export function useCheckout() {
  const authStore = useAuthStore()
  const loading = ref(false)

  async function startCheckout(type: 'pro' | 'day_pass', returnTo?: string) {
    if (loading.value) return

    if (authStore.isGuest || !authStore.token) {
      authStore.clear()
      const { pathname, search } = window.location
      setPostAuthRedirect(pathname === '/projects' ? '/projects?openUrlCapture=1' : pathname + search, type)
      toast.info('Sign in to continue')
      await navigateTo('/login')
      return
    }

    loading.value = true
    try {
      const { url } = await $fetch<{ url: string }>('/api/checkout/create', {
        method: 'POST',
        headers: { Authorization: `Bearer ${authStore.token}` },
        body: { type },
      })
      localStorage.setItem('snipfolio_checkout_return', returnTo ?? window.location.pathname + window.location.search)
      localStorage.setItem('snipfolio_checkout_type', type)
      window.location.href = url
      // Leave loading=true — the page is navigating away, so the button
      // should stay disabled rather than allow a duplicate checkout request.
    } catch (e) {
      console.error('[startCheckout] error:', e)
      const statusCode = (e as { statusCode?: number })?.statusCode
      if (statusCode === 401 || statusCode === 403) {
        toast.error('Please sign in again to continue')
        authStore.clear()
        await navigateTo('/login')
      } else {
        toast.error('Could not start checkout', { description: 'Please try again in a moment.' })
      }
      loading.value = false
    }
  }

  return { startCheckout, loading }
}
