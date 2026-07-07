export default defineEventHandler(async (event) => {
  const userId = await requireUser(event)
  const sb = useSupabaseAdmin()

  const { data: profile } = await sb
    .from('profiles')
    .select('is_pro, is_admin, pro_expires_at, capture_count, pro_capture_count, pro_capture_period_start')
    .eq('id', userId)
    .single()

  const captures = getCaptureStatus({
    is_pro: profile?.is_pro ?? false,
    pro_expires_at: profile?.pro_expires_at ?? null,
    capture_count: profile?.capture_count ?? 0,
    pro_capture_count: profile?.pro_capture_count ?? 0,
    pro_capture_period_start: profile?.pro_capture_period_start ?? null,
  })

  return {
    isPro: profile?.is_pro ?? false,
    isAdmin: profile?.is_admin ?? false,
    proExpiresAt: profile?.pro_expires_at ?? null,
    captureLimit: captures.limit,
    capturesUsed: captures.used,
    capturesRemaining: captures.remaining,
  }
})
