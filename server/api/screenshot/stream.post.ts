import { streamScreenshot } from '../../utils/screenshot'

/**
 * Wraps the upstream SSE body so bytes still flow straight through to the client, but only
 * records capture usage once a real 'done' event is observed — a stream that starts fine but
 * errors out mid-capture (timeout, page crash) must not consume the user's allowance.
 */
function withUsageOnDone(body: ReadableStream<Uint8Array>, commit: () => Promise<void>): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder()
  let buf = ''
  let committed = false

  const passthrough = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      controller.enqueue(chunk)
      if (committed) return

      buf += decoder.decode(chunk, { stream: true })
      let sep: number
      while ((sep = buf.indexOf('\n\n')) !== -1) {
        const frame = buf.slice(0, sep)
        buf = buf.slice(sep + 2)
        const eventLine = frame.split('\n').find(line => line.startsWith('event:'))
        const eventType = eventLine ? eventLine.slice(6).trim() : 'message'
        if (eventType === 'done') {
          committed = true
          commit().catch(err => console.error('[screenshot/stream] failed to record capture usage:', err))
          break
        }
      }
    },
  })

  return body.pipeThrough(passthrough)
}

export default defineEventHandler(async (event) => {
  const userId = await requireUser(event)
  const allowance = await requireCaptureAllowance(userId)

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

  if (!upstream.body) return upstream.body

  return withUsageOnDone(upstream.body, allowance.commit)
})
