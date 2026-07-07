export const FREE_CAPTURE_LIMIT = 3
export const PRO_CAPTURE_MONTHLY_LIMIT = 200
const PRO_CAPTURE_PERIOD_MS = 30 * 24 * 60 * 60 * 1000

export interface CaptureProfileRow {
  is_pro: boolean
  pro_expires_at: string | null
  capture_count: number
  pro_capture_count: number
  pro_capture_period_start: string | null
}

export interface CaptureStatus {
  isPro: boolean
  limit: number
  used: number
  remaining: number
  /** Pro users only: true once the current monthly window has elapsed and should roll forward. */
  periodExpired: boolean
}

/** Pure projection of a profile row into "how many captures does this user have left". */
export function getCaptureStatus(profile: CaptureProfileRow): CaptureStatus {
  const hasActiveDayPass = !!profile.pro_expires_at && new Date(profile.pro_expires_at) > new Date()
  const isPro = profile.is_pro || hasActiveDayPass

  if (!isPro) {
    const used = profile.capture_count
    return { isPro: false, limit: FREE_CAPTURE_LIMIT, used, remaining: Math.max(0, FREE_CAPTURE_LIMIT - used), periodExpired: false }
  }

  const periodStart = profile.pro_capture_period_start ? new Date(profile.pro_capture_period_start).getTime() : null
  const periodExpired = periodStart === null || Date.now() - periodStart > PRO_CAPTURE_PERIOD_MS
  const used = periodExpired ? 0 : profile.pro_capture_count
  return { isPro: true, limit: PRO_CAPTURE_MONTHLY_LIMIT, used, remaining: Math.max(0, PRO_CAPTURE_MONTHLY_LIMIT - used), periodExpired }
}
