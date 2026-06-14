/** Throws a 403 unless the user has an active Pro subscription or day pass. */
export async function requirePro(userId: string): Promise<void> {
  const sb = useSupabaseAdmin()
  const { data: profile } = await sb
    .from('profiles')
    .select('is_pro, pro_expires_at')
    .eq('id', userId)
    .single()

  const hasActiveDayPass = !!profile?.pro_expires_at && new Date(profile.pro_expires_at) > new Date()
  if (!profile?.is_pro && !hasActiveDayPass) {
    throw createError({ statusCode: 403, message: 'Capturing from a URL is a Pro feature' })
  }
}
