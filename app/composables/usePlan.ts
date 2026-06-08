import { useAuthStore } from '~/stores/auth'
import { useProjectStore } from '~/stores/project'

export function usePlan() {
  const authStore = useAuthStore()
  const projectStore = useProjectStore()
  const isGuest = computed(() => authStore.isGuest)
  const isPro = computed(() => authStore.isPro)
  const isAdmin = computed(() => authStore.isAdmin)

  async function hasActiveDayAccess(projectId: string): Promise<boolean> {
    if (!authStore.user || authStore.isGuest) return false
    const sb = useSupabaseClient()
    if (!sb) return false
    const { data } = await sb
      .from('project_export_access')
      .select('expires_at')
      .eq('project_id', projectId)
      .eq('user_id', authStore.user.id)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()
    return !!data
  }

  async function getDayAccessExpiry(projectId: string): Promise<Date | null> {
    if (!authStore.user || authStore.isGuest) return null
    const sb = useSupabaseClient()
    if (!sb) return null
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
    if (authStore.isPro) return true
    return projectStore.projects.length < 1
  }

  return { isGuest, isPro, isAdmin, hasActiveDayAccess, getDayAccessExpiry, canExportClean, canCreateProject }
}
