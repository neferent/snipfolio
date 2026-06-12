import { takeScreenshot } from '../utils/screenshot'

export default defineEventHandler(async (event) => {
  const userId = await requireUser(event)

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

  const { url, viewport } = await readBody(event)

  if (!url || !viewport) {
    throw createError({ statusCode: 400, message: 'url and viewport are required' })
  }

  const png = await takeScreenshot(url, viewport)

  setResponseHeader(event, 'Content-Type', 'image/png')
  return png
})
