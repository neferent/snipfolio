import { createHmac } from 'node:crypto'

export async function takeScreenshot(url: string, viewport: 'desktop' | 'tablet' | 'mobile' = 'desktop'): Promise<Buffer> {
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const message = `${timestamp}\n${url}\n${viewport}`
  const signature = createHmac('sha256', process.env.CAPTURE_SIGNING_SECRET!).update(message).digest('hex')

  const res = await fetch(process.env.SCREENSHOTTER_URL + '/screenshot', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.SCREENSHOTTER_TOKEN}`,
      'X-Capture-Timestamp': timestamp,
      'X-Capture-Signature': signature,
    },
    body: JSON.stringify({ url, viewport }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string }
    throw new Error(err.error || `Screenshot failed: ${res.status}`)
  }

  return Buffer.from(await res.arrayBuffer())
}
