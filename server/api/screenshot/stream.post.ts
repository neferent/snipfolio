import { streamScreenshot } from '../../utils/screenshot'

export default defineEventHandler(async (event) => {
  const userId = await requireUser(event)
  await requireCaptureAllowance(userId)

  const { url, viewport } = await readBody(event)

  if (!url || !viewport) {
    throw createError({ statusCode: 400, message: 'url and viewport are required' })
  }

  let upstream: Response
  try {
    upstream = await streamScreenshot(url, viewport)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Screenshot failed'
    throw createError({ statusCode: 502, statusMessage: 'Screenshot failed', message })
  }

  setResponseHeader(event, 'Content-Type', 'text/event-stream')
  setResponseHeader(event, 'Cache-Control', 'no-cache')
  setResponseHeader(event, 'Connection', 'keep-alive')
  setResponseHeader(event, 'X-Accel-Buffering', 'no')

  return upstream.body
})
