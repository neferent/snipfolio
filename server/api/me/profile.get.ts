export default defineEventHandler(async (event) => {
  const userId = await requireUser(event)
  const sb = useSupabaseAdmin()

  const { data: profile } = await sb
    .from('profiles')
    .select('is_pro, is_admin, pro_expires_at')
    .eq('id', userId)
    .single()

  return {
    isPro: profile?.is_pro ?? false,
    isAdmin: profile?.is_admin ?? false,
    proExpiresAt: profile?.pro_expires_at ?? null,
  }
})
