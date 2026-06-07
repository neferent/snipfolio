export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const projectId = getRouterParam(event, 'id')!
  const body = await readBody<{ userId: string }>(event)

  const sb = useSupabaseAdmin()
  const { error } = await sb
    .from('project_export_access')
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', body.userId)

  if (error) throw createError({ statusCode: 500, message: error.message })
  return { ok: true }
})
