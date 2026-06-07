export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const projectId = getRouterParam(event, 'id')!
  const body = await readBody<{ userId: string; hours?: number }>(event)
  const hours = body.hours ?? 24

  const sb = useSupabaseAdmin()
  const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()

  const { error } = await sb
    .from('project_export_access')
    .upsert(
      { project_id: projectId, user_id: body.userId, expires_at: expiresAt },
      { onConflict: 'project_id,user_id' },
    )

  if (error) throw createError({ statusCode: 500, message: error.message })
  return { ok: true, expiresAt }
})
