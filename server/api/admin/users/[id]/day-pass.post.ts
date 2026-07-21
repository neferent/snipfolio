export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const userId = getRouterParam(event, 'id')!

  const sb = useSupabaseAdmin()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const { error } = await sb
    .from('profiles')
    .upsert({ id: userId, pro_expires_at: expiresAt }, { onConflict: 'id' })

  if (error) throw createError({ statusCode: 500, message: error.message })
  return { ok: true, expiresAt }
})
