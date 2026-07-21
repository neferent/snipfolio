import { useAuthStore } from '~/stores/auth'
import { useProjectStore } from '~/stores/project'

export const PROJECT_LIMIT = 3

export function usePlan() {
  const authStore = useAuthStore()
  const projectStore = useProjectStore()
  const isGuest = computed(() => authStore.isGuest)
  const isAdmin = computed(() => authStore.isAdmin)

  // A 7-day pass grants full Pro access for 7 days, account-wide, without a subscription
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

  function canCreateProject(): boolean {
    return isPro.value || projectStore.projects.length < PROJECT_LIMIT
  }

  // Free (and lapsed-Pro) accounts can only open their oldest PROJECT_LIMIT projects —
  // the rest stay intact but locked until the user pays or deletes down to the limit.
  const accessibleProjectIds = computed(() => {
    if (isPro.value) return null // null = no restriction, every project is accessible
    return new Set(
      [...projectStore.projects]
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .slice(0, PROJECT_LIMIT)
        .map((p) => p.id),
    )
  })

  function isProjectLocked(projectId: string): boolean {
    const accessible = accessibleProjectIds.value
    return accessible !== null && !accessible.has(projectId)
  }

  return {
    isGuest, isPro, isAdmin, isDayPassActive, dayPassExpiresAt, canCreateProject,
    captureLimit, capturesUsed, capturesRemaining,
    accessibleProjectIds, isProjectLocked,
  }
}

/** Formats a pass expiry as e.g. "Jun 17, 3:42 PM" — used for the "active until" UI. */
export function formatPassExpiry(date: Date): string {
  const datePart = date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  const timePart = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return `${datePart}, ${timePart}`
}
