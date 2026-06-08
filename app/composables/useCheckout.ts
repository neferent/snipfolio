import { useAuthStore } from '~/stores/auth'

export function useCheckout() {
  const authStore = useAuthStore()
  const loading = ref(false)

  async function startCheckout(type: 'pro_early' | 'day_pass', projectId?: string) {
    if (loading.value) return
    loading.value = true
    try {
      const { url } = await $fetch<{ url: string }>('/api/checkout/create', {
        method: 'POST',
        headers: { Authorization: `Bearer ${authStore.token}` },
        body: { type, projectId },
      })
      window.location.href = url
    } finally {
      loading.value = false
    }
  }

  return { startCheckout, loading }
}
