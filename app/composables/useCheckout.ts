import { useAuthStore } from '~/stores/auth'
import { toast } from '~/composables/useToast'
import { setPostAuthRedirect } from '~/composables/usePostAuthRedirect'

export function useCheckout() {
  const authStore = useAuthStore()
  const loading = ref(false)

  async function startCheckout(type: 'pro_early' | 'day_pass', returnTo?: string) {
    if (loading.value) return

    if (authStore.isGuest || !authStore.token) {
      authStore.clear()
      const { pathname, search } = window.location
      setPostAuthRedirect(pathname === '/dashboard' ? '/dashboard?openUrlCapture=1' : pathname + search, type)
      toast.info('Sign in to upgrade to Pro')
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
    } catch (e) {
      console.error('[startCheckout] error:', e)
      toast.error('Could not start checkout', { description: 'Please sign in again and retry.' })
      authStore.clear()
      await navigateTo('/login')
    } finally {
      loading.value = false
    }
  }

  return { startCheckout, loading }
}
