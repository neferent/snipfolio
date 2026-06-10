import { takeScreenshot } from '../utils/screenshot'

export default defineEventHandler(async (event) => {
  const { url, viewport } = await readBody(event)

  if (!url || !viewport) {
    throw createError({ statusCode: 400, message: 'url and viewport are required' })
  }

  const png = await takeScreenshot(url, viewport)

  setResponseHeader(event, 'Content-Type', 'image/png')
  return png
})
