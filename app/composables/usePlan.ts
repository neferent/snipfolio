import { useAuthStore } from '~/stores/auth'
import { useProjectStore } from '~/stores/project'

export function usePlan() {
  const authStore = useAuthStore()
  const projectStore = useProjectStore()
  const isGuest = computed(() => authStore.isGuest)
  const isAdmin = computed(() => authStore.isAdmin)

  // A 3-day access pass grants full Pro access for 72h, account-wide, without a subscription
  const isDayPassActive = computed(() => {
    if (authStore.isPro || !authStore.proExpiresAt) return false
    return new Date(authStore.proExpiresAt) > new Date()
  })

  const dayPassExpiresAt = computed(() => (
    isDayPassActive.value ? new Date(authStore.proExpiresAt as string) : null
  ))

  const isPro = computed(() => authStore.isPro || isDayPassActive.value)

  const captureLimit = computed(() => authStore.captureLimit)
  const capturesUsed = computed(() => authStore.capturesUsed)
  const capturesRemaining = computed(() => authStore.capturesRemaining)

  const PROJECT_LIMIT = 50

  function canCreateProject(): boolean {
    return projectStore.projects.length < PROJECT_LIMIT
  }

  return {
    isGuest, isPro, isAdmin, isDayPassActive, dayPassExpiresAt, canCreateProject,
    captureLimit, capturesUsed, capturesRemaining,
  }
}

/** Formats a pass expiry as e.g. "Jun 17, 3:42 PM" — used for the "active until" UI. */
export function formatPassExpiry(date: Date): string {
  const datePart = date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  const timePart = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return `${datePart}, ${timePart}`
}
