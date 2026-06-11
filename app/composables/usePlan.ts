import { useAuthStore } from '~/stores/auth'
import { useProjectStore } from '~/stores/project'

export function usePlan() {
  const authStore = useAuthStore()
  const projectStore = useProjectStore()
  const isGuest = computed(() => authStore.isGuest)
  const isAdmin = computed(() => authStore.isAdmin)

  // A day pass grants full Pro access for 24h, account-wide, without a subscription
  const isDayPassActive = computed(() => {
    if (authStore.isPro || !authStore.proExpiresAt) return false
    return new Date(authStore.proExpiresAt) > new Date()
  })

  const dayPassExpiresAt = computed(() => (
    isDayPassActive.value ? new Date(authStore.proExpiresAt as string) : null
  ))

  const isPro = computed(() => authStore.isPro || isDayPassActive.value)

  const PRO_PROJECT_LIMIT = 50

  function canCreateProject(): boolean {
    if (isPro.value) return projectStore.projects.length < PRO_PROJECT_LIMIT
    return projectStore.projects.length < 1
  }

  return { isGuest, isPro, isAdmin, isDayPassActive, dayPassExpiresAt, canCreateProject }
}
