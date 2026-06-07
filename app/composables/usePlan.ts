import { useAuthStore } from '~/stores/auth'
import { useProjectStore } from '~/stores/project'

export function usePlan() {
  const authStore = useAuthStore()
  const projectStore = useProjectStore()
  const config = useRuntimeConfig()

  const isSupabase = config.public.authMode === 'supabase'

  const isGuest = computed(() => authStore.isGuest)
  const isPro = computed(() => authStore.isPro)
  const isAdmin = computed(() => authStore.isAdmin)

  // Returns true if the project has an active (non-expired) day-access record for this user
  async function hasActiveDayAccess(projectId: string): Promise<boolean> {
    if (!authStore.user || authStore.isGuest) return false
    if (!isSupabase) {
      if (!import.meta.client) return false
      const raw = localStorage.getItem(`snipfolio_dayaccess_${projectId}`)
      if (!raw) return false
      try {
        const { expiresAt } = JSON.parse(raw) as { expiresAt: string }
        return new Date(expiresAt) > new Date()
      } catch {
        return false
      }
    }
    const sb = useSupabaseClient()
    const { data } = await sb
      .from('project_export_access')
      .select('expires_at')
      .eq('project_id', projectId)
      .eq('user_id', authStore.user.id)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()
    return !!data
  }

  // Returns the expiry date for the active day access, or null
  async function getDayAccessExpiry(projectId: string): Promise<Date | null> {
    if (!authStore.user || authStore.isGuest) return null
    if (!isSupabase) {
      if (!import.meta.client) return null
      const raw = localStorage.getItem(`snipfolio_dayaccess_${projectId}`)
      if (!raw) return null
      try {
        const { expiresAt } = JSON.parse(raw) as { expiresAt: string }
        const d = new Date(expiresAt)
        return d > new Date() ? d : null
      } catch {
        return null
      }
    }
    const sb = useSupabaseClient()
    const { data } = await sb
      .from('project_export_access')
      .select('expires_at')
      .eq('project_id', projectId)
      .eq('user_id', authStore.user.id)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()
    if (!data) return null
    return new Date(data.expires_at as string)
  }

  async function canExportClean(projectId: string): Promise<boolean> {
    if (authStore.isPro) return true
    return hasActiveDayAccess(projectId)
  }

  function canCreateProject(): boolean {
    if (authStore.isGuest) return false
    if (authStore.isPro) return true
    return projectStore.projects.length < 1
  }

  return { isGuest, isPro, isAdmin, hasActiveDayAccess, getDayAccessExpiry, canExportClean, canCreateProject }
}
