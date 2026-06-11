export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const userId = getRouterParam(event, 'id')!

  const sb = useSupabaseAdmin()
  const { error } = await sb
    .from('profiles')
    .update({ pro_expires_at: null })
    .eq('id', userId)

  if (error) throw createError({ statusCode: 500, message: error.message })
  return { ok: true }
})
