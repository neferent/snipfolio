/** Resolves user-typed URL input to a fully-qualified URL, defaulting to https://. */
export function resolveCaptureUrl(input: string): string {
  if (!input) return ''
  if (input.startsWith('http://') || input.startsWith('https://')) return input
  return `https://${input}`
}

/** Extracts the hostname from user-typed URL input, falling back to the raw input. */
export function getCaptureHostname(input: string): string {
  try {
    return new URL(resolveCaptureUrl(input)).hostname
  } catch {
    return input
  }
}

/** Whether the input looks like a capturable URL (has a real hostname, not just a bare word). */
export function isValidCaptureUrl(input: string): boolean {
  if (!input) return false
  try {
    const { hostname } = new URL(resolveCaptureUrl(input))
    return hostname.includes('.') || hostname === 'localhost'
  } catch {
    return false
  }
}

/** Tracks elapsed seconds while a capture is in flight, for "still working" progress hints. */
export function useCaptureElapsed() {
  const elapsedSeconds = ref(0)
  let interval: ReturnType<typeof setInterval> | null = null

  function start() {
    stop()
    elapsedSeconds.value = 0
    interval = setInterval(() => { elapsedSeconds.value++ }, 1000)
  }

  function stop() {
    if (interval) {
      clearInterval(interval)
      interval = null
    }
  }

  onScopeDispose(stop)

  return { elapsedSeconds, start, stop }
}

/** Friendly "still working" hint shown during capture, based on elapsed seconds. */
export function captureProgressHint(elapsedSeconds: number): string {
  if (elapsedSeconds < 5) return 'Capturing the page…'
  if (elapsedSeconds < 12) return 'Full pages can take up to 15s…'
  return 'Still working — large pages take a bit longer…'
}
