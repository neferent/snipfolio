import { takeScreenshot } from '../utils/screenshot'

export default defineEventHandler(async (event) => {
  const userId = await requireUser(event)
  const allowance = await requireCaptureAllowance(userId)

  const { url, viewport } = await readBody(event)

  if (!url || !viewport) {
    throw createError({ statusCode: 400, message: 'url and viewport are required' })
  }

  let png: Buffer
  try {
    png = await takeScreenshot(url, viewport)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Screenshot failed'
    throw createError({ statusCode: 502, statusMessage: 'Screenshot failed', message })
  }

  await allowance.commit()

  setResponseHeader(event, 'Content-Type', 'image/png')
  return png
})
