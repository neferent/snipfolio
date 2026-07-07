import { getCaptureStatus, PRO_CAPTURE_MONTHLY_LIMIT } from './captureAllowance'

/** Throws a 403 once a user has exhausted their capture allowance; otherwise records the capture. */
export async function requireCaptureAllowance(userId: string): Promise<void> {
  const sb = useSupabaseAdmin()
  const { data: profile } = await sb
    .from('profiles')
    .select('is_pro, pro_expires_at, capture_count, pro_capture_count, pro_capture_period_start')
    .eq('id', userId)
    .single()

  if (!profile) throw createError({ statusCode: 403, message: 'Profile not found' })

  const status = getCaptureStatus(profile)
  if (status.remaining <= 0) {
    const message = status.isPro
      ? `You've used all ${status.limit} captures for this month.`
      : `You've used all ${status.limit} free captures. Upgrade to Pro for ${PRO_CAPTURE_MONTHLY_LIMIT}/month.`
    throw createError({ statusCode: 403, message })
  }

  if (status.isPro) {
    await sb.from('profiles').update({
      pro_capture_count: status.used + 1,
      pro_capture_period_start: status.periodExpired ? new Date().toISOString() : profile.pro_capture_period_start,
    }).eq('id', userId)
  } else {
    await sb.from('profiles').update({ capture_count: status.used + 1 }).eq('id', userId)
  }
}
