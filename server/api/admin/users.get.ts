export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const sb = useSupabaseAdmin()

  // Fetch all auth users via admin API
  const { data: { users }, error: usersError } = await sb.auth.admin.listUsers()
  if (usersError) throw createError({ statusCode: 500, message: usersError.message })

  // Fetch all profiles
  const { data: profiles } = await sb.from('profiles').select('id, is_pro, is_admin')

  // Fetch project counts per user
  const { data: projects } = await sb.from('projects').select('id, user_id')

  // Fetch active day access
  const { data: access } = await sb
    .from('project_export_access')
    .select('user_id, project_id, expires_at')
    .gt('expires_at', new Date().toISOString())

  // Fetch project names for day access
  const projectIds = (access ?? []).map((a: { project_id: string }) => a.project_id)
  const { data: projectNames } = projectIds.length
    ? await sb.from('projects').select('id, name').in('id', projectIds)
    : { data: [] as { id: string; name: string }[] }

  type Profile = { id: string; is_pro: boolean; is_admin: boolean }
  const profileMap = new Map((profiles ?? []).map((p: Profile) => [p.id, p]))
  const projectCountMap = new Map<string, number>()
  for (const p of projects ?? [] as { id: string; user_id: string }[]) {
    projectCountMap.set((p as { user_id: string }).user_id, (projectCountMap.get((p as { user_id: string }).user_id) ?? 0) + 1)
  }
  type AccessRow = { user_id: string; project_id: string; expires_at: string }
  const accessByUser = new Map<string, { projectId: string; projectName: string; expiresAt: string }[]>()
  for (const a of (access ?? []) as AccessRow[]) {
    const name = ((projectNames ?? []) as { id: string; name: string }[]).find((p) => p.id === a.project_id)?.name ?? a.project_id
    const list = accessByUser.get(a.user_id) ?? []
    list.push({ projectId: a.project_id, projectName: name, expiresAt: a.expires_at })
    accessByUser.set(a.user_id, list)
  }

  return users.map((u) => {
    const profile = profileMap.get(u.id) as Profile | undefined
    return {
      id: u.id,
      email: u.email ?? '',
      isPro: profile?.is_pro ?? false,
      isAdmin: profile?.is_admin ?? false,
      projectCount: projectCountMap.get(u.id) ?? 0,
      dayAccess: accessByUser.get(u.id) ?? [],
      createdAt: u.created_at,
    }
  })
})
