import { useAuthStore } from '~/stores/auth'

export function useCheckout() {
  const authStore = useAuthStore()
  const loading = ref(false)

  async function startCheckout(type: 'pro_early' | 'day_pass') {
    if (loading.value) return
    loading.value = true
    try {
      const { url } = await $fetch<{ url: string }>('/api/checkout/create', {
        method: 'POST',
        headers: { Authorization: `Bearer ${authStore.token}` },
        body: { type },
      })
      localStorage.setItem('snipfolio_checkout_return', window.location.pathname + window.location.search)
      localStorage.setItem('snipfolio_checkout_type', type)
      window.location.href = url
    } finally {
      loading.value = false
    }
  }

  return { startCheckout, loading }
}
