import { useAuthStore } from '~/stores/auth'

const _hidden = ref(false)

export function useWatermarkPreview() {
  const authStore = useAuthStore()
  const active = computed(() => !authStore.isPro && !_hidden.value)
  function toggle() { _hidden.value = !_hidden.value }
  return { active, hidden: _hidden, toggle }
}
