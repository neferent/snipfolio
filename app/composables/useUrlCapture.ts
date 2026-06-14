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
  if (elapsedSeconds < 20) return 'Still working — large pages take a bit longer…'
  return 'The capture service is waking up — this can take up to 30s…'
}

/** Typical duration of a desktop+mobile capture once the service is warm, in seconds — shapes the progress bar curve. */
export const CAPTURE_EXPECTED_DURATION = 8

export type CaptureViewport = 'desktop' | 'tablet' | 'mobile'
export type CapturePreset = 'laptop+phone' | 'laptop+tablet+phone' | 'browser' | 'browser+url'

export interface CapturePresetDef {
  id: CapturePreset
  label: string
  description: string
  viewports: CaptureViewport[]
}

/** Output presets offered on the "From URL" capture step, each capturing a different set of viewports. */
export const CAPTURE_PRESETS: CapturePresetDef[] = [
  { id: 'laptop+phone', label: 'Laptop + Phone', description: 'Desktop and mobile, side by side', viewports: ['desktop', 'mobile'] },
  { id: 'laptop+tablet+phone', label: 'Laptop + Tablet + Phone', description: 'Desktop, tablet, and mobile', viewports: ['desktop', 'tablet', 'mobile'] },
  { id: 'browser', label: 'Browser', description: 'Desktop view in a browser frame', viewports: ['desktop'] },
  { id: 'browser+url', label: 'Browser + URL', description: 'Browser frame with the page URL shown', viewports: ['desktop'] },
]

const CAPTURE_STAGES: { label: string; at: number }[] = [
  { label: 'Fetching page…', at: 0 },
  { label: 'Rendering desktop view…', at: 2 },
  { label: 'Rendering mobile view…', at: 6 },
  { label: 'Almost done…', at: 10 },
  { label: 'The capture service is waking up — this can take a bit longer…', at: 20 },
]

/** Cycles through capture stage labels based on elapsed seconds, for the "From URL" capture step. */
export function captureStageLabel(elapsedSeconds: number): string {
  let label = CAPTURE_STAGES[0]!.label
  for (const stage of CAPTURE_STAGES) {
    if (elapsedSeconds >= stage.at) label = stage.label
  }
  return label
}

/**
 * Progress bar fill percentage. Approaches 95% asymptotically so it never appears
 * complete before the capture finishes, but keeps creeping forward (rather than
 * sticking at a hard cap) during slow captures like cold starts.
 */
export function captureProgressPercent(elapsedSeconds: number): number {
  return 95 * (1 - Math.exp(-elapsedSeconds / CAPTURE_EXPECTED_DURATION))
}
