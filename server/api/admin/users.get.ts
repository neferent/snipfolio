export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const sb = useSupabaseAdmin()

  // Fetch all auth users via admin API
  const { data: { users }, error: usersError } = await sb.auth.admin.listUsers()
  if (usersError) throw createError({ statusCode: 500, message: usersError.message })

  // Fetch all profiles
  const { data: profiles } = await sb.from('profiles').select('id, is_pro, is_admin, pro_expires_at')

  // Fetch project counts per user
  const { data: projects } = await sb.from('projects').select('id, user_id')

  type Profile = { id: string; is_pro: boolean; is_admin: boolean; pro_expires_at: string | null }
  const profileMap = new Map((profiles ?? []).map((p: Profile) => [p.id, p]))
  const projectCountMap = new Map<string, number>()
  for (const p of projects ?? [] as { id: string; user_id: string }[]) {
    projectCountMap.set((p as { user_id: string }).user_id, (projectCountMap.get((p as { user_id: string }).user_id) ?? 0) + 1)
  }

  return users.map((u) => {
    const profile = profileMap.get(u.id) as Profile | undefined
    return {
      id: u.id,
      email: u.email ?? '',
      isPro: profile?.is_pro ?? false,
      isAdmin: profile?.is_admin ?? false,
      projectCount: projectCountMap.get(u.id) ?? 0,
      proExpiresAt: profile?.pro_expires_at ?? null,
      createdAt: u.created_at,
    }
  })
})
