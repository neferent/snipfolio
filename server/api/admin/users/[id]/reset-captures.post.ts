export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const userId = getRouterParam(event, 'id')!

  const sb = useSupabaseAdmin()
  const { error } = await sb
    .from('profiles')
    .update({ capture_count: 0, pro_capture_count: 0, pro_capture_period_start: null })
    .eq('id', userId)

  if (error) throw createError({ statusCode: 500, message: error.message })
  return { ok: true }
})
