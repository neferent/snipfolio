export default defineEventHandler(async (event) => {
  const adminId = await requireAdmin(event)
  const userId = getRouterParam(event, 'id')!
  if (userId === adminId) throw createError({ statusCode: 403, message: 'Cannot reset your own account' })
  const sb = useSupabaseAdmin()

  // Delete all projects (cascades to snips, compositions, source_images)
  const { error } = await sb.from('projects').delete().eq('user_id', userId)
  if (error) throw createError({ statusCode: 500, message: error.message })

  // Delete storage files for this user
  const { data: files } = await sb.storage.from('screenshots').list(userId)
  if (files && files.length > 0) {
    const paths = files.map((f: { name: string }) => `${userId}/${f.name}`)
    await sb.storage.from('screenshots').remove(paths)
  }

  // Reset profile flags but keep the account
  await sb.from('profiles').update({
    is_pro: false,
    pro_expires_at: null,
    capture_count: 0,
    pro_capture_count: 0,
    pro_capture_period_start: null,
  }).eq('id', userId)

  return { ok: true }
})
