import { createHmac } from 'node:crypto'

const SCREENSHOT_TIMEOUT_MS = 45_000

export async function takeScreenshot(url: string, viewport: 'desktop' | 'tablet' | 'mobile' = 'desktop'): Promise<Buffer> {
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const message = `${timestamp}\n${url}\n${viewport}`
  const signature = createHmac('sha256', process.env.CAPTURE_SIGNING_SECRET!).update(message).digest('hex')

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
      body: JSON.stringify({ url, viewport }),
      signal: AbortSignal.timeout(SCREENSHOT_TIMEOUT_MS),
    })
  } catch (err) {
    if (err instanceof Error && err.name === 'TimeoutError') {
      throw new Error('Screenshot timed out. The site may be slow or unreachable — try again later.')
    }
    throw new Error('Could not reach the screenshot service. Try again later.')
  }

  if (!res.ok) {
    const err = await res.json().catch(() => null) as { error?: string } | null
    if (err?.error) throw new Error(err.error)
    if (res.status === 403) throw new Error('The website blocked the screenshot request. Try a different URL.')
    if (res.status === 404) throw new Error('That page could not be found.')
    if (res.status === 408 || res.status === 504) throw new Error('The page took too long to load.')
    throw new Error(`Screenshot failed (${res.status}). Try again later.`)
  }

  return Buffer.from(await res.arrayBuffer())
}
