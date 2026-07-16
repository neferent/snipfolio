import { createHmac } from 'node:crypto'

const SCREENSHOT_TIMEOUT_MS = 45_000

export type ScreenshotViewport = 'desktop' | 'tablet' | 'mobile'

/**
 * Signs a capture request for the screenshotter's HMAC-based auth (see CAPTURE_SIGNING_SECRET).
 * Message is `${timestamp}\n${url}\n${viewport}\n${deviceScaleFactor}` — when deviceScaleFactor
 * is omitted, an empty string is signed in its place (not a fallback number), matching what the
 * screenshotter expects when the JSON body itself omits the key.
 */
function signCapture(url: string, viewport: ScreenshotViewport, deviceScaleFactor?: number): { timestamp: string; signature: string } {
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const dsfPart = deviceScaleFactor !== undefined ? String(deviceScaleFactor) : ''
  const message = `${timestamp}\n${url}\n${viewport}\n${dsfPart}`
  const signature = createHmac('sha256', process.env.CAPTURE_SIGNING_SECRET!).update(message).digest('hex')
  return { timestamp, signature }
}

/** Maps a non-ok screenshotter response to a user-facing error message. */
async function screenshotErrorFromResponse(res: Response): Promise<Error> {
  const err = await res.json().catch(() => null) as { error?: string } | null
  if (err?.error) return new Error(err.error)
  if (res.status === 403) return new Error('The website blocked the screenshot request. Try a different URL.')
  if (res.status === 404) return new Error('That page could not be found.')
  if (res.status === 408 || res.status === 504) return new Error('The page took too long to load.')
  return new Error(`Screenshot failed (${res.status}). Try again later.`)
}

export async function takeScreenshot(url: string, viewport: ScreenshotViewport = 'desktop', deviceScaleFactor: number | undefined = 1): Promise<Buffer> {
  const { timestamp, signature } = signCapture(url, viewport, deviceScaleFactor)

  let res: Response
  try {
    res = await fetch(process.env.SCREENSHOTTER_URL + '/screenshot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SCREENSHOTTER_TOKEN}`,
        'X-Capture-Timestamp': timestamp,
        'X-Capture-Signature': signature,
      },
      body: JSON.stringify({ url, viewport, ...(deviceScaleFactor !== undefined ? { deviceScaleFactor } : {}) }),
      signal: AbortSignal.timeout(SCREENSHOT_TIMEOUT_MS),
    })
  } catch (err) {
    if (err instanceof Error && err.name === 'TimeoutError') {
      throw new Error('Screenshot timed out. The site may be slow or unreachable — try again later.')
    }
    throw new Error('Could not reach the screenshot service. Try again later.')
  }

  if (!res.ok) throw await screenshotErrorFromResponse(res)

  return Buffer.from(await res.arrayBuffer())
}

/**
 * Starts a streaming (SSE) capture and returns the raw upstream Response so the caller can
 * pipe its body to the browser. Throws if the request fails before the stream starts
 * (auth/validation errors return JSON with a non-200 status before any SSE bytes are sent).
 */
export async function streamScreenshot(url: string, viewport: ScreenshotViewport = 'desktop', deviceScaleFactor: number | undefined = 1): Promise<Response> {
  const { timestamp, signature } = signCapture(url, viewport, deviceScaleFactor)

  let res: Response
  try {
    res = await fetch(process.env.SCREENSHOTTER_URL + '/screenshot/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SCREENSHOTTER_TOKEN}`,
        'X-Capture-Timestamp': timestamp,
        'X-Capture-Signature': signature,
      },
      body: JSON.stringify({ url, viewport, ...(deviceScaleFactor !== undefined ? { deviceScaleFactor } : {}) }),
      signal: AbortSignal.timeout(SCREENSHOT_TIMEOUT_MS),
    })
  } catch (err) {
    if (err instanceof Error && err.name === 'TimeoutError') {
      throw new Error('Screenshot timed out. The site may be slow or unreachable — try again later.')
    }
    throw new Error('Could not reach the screenshot service. Try again later.')
  }

  if (!res.ok) throw await screenshotErrorFromResponse(res)

  return res
}
