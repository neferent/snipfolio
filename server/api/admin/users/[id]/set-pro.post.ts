export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const userId = getRouterParam(event, 'id')!
  const body = await readBody<{ isPro: boolean }>(event)

  const sb = useSupabaseAdmin()
  const { error } = await sb
    .from('profiles')
    .upsert({ id: userId, is_pro: body.isPro }, { onConflict: 'id' })

  if (error) throw createError({ statusCode: 500, message: error.message })
  return { ok: true }
})
