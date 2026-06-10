export async function takeScreenshot(url: string, viewport: 'desktop' | 'tablet' | 'mobile' = 'desktop'): Promise<Buffer> {
  const res = await fetch(process.env.SCREENSHOTTER_URL + '/screenshot', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.SCREENSHOTTER_TOKEN}`,
    },
    body: JSON.stringify({ url, viewport }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string }
    throw new Error(err.error || `Screenshot failed: ${res.status}`)
  }

  return Buffer.from(await res.arrayBuffer())
}
