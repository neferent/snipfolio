export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const userId = getRouterParam(event, 'id')!
  const sb = useSupabaseAdmin()

  const { data, error } = await sb
    .from('projects')
    .select('id, name')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) throw createError({ statusCode: 500, message: error.message })
  return data ?? []
})
