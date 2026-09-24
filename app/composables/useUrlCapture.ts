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

export type CaptureViewport = 'desktop' | 'tablet' | 'mobile'
export type CapturePreset = 'laptop+phone' | 'laptop+tablet+phone' | 'browser' | 'browser+url'

// Screen area aspect ratios (width/height) matching the SVG frame definitions
export const LAPTOP_SCREEN_ASPECT = 3034.7 / 1964.07  // ≈ 1.545
export const TABLET_SCREEN_ASPECT = (2377.7 - 79.14) / (1803.11 - 80.08)  // ≈ 1.334
export const PHONE_SCREEN_ASPECT  = 709.65 / 1539.77  // ≈ 0.461

export const VIEWPORT_SCREEN_ASPECT: Record<CaptureViewport, number> = {
  desktop: LAPTOP_SCREEN_ASPECT,
  tablet: TABLET_SCREEN_ASPECT,
  mobile: PHONE_SCREEN_ASPECT,
}

export const VIEWPORT_SNAP_FRAME: Record<CaptureViewport, 'laptop' | 'tablet' | 'phone'> = {
  desktop: 'laptop',
  tablet: 'tablet',
  mobile: 'phone',
}

export const VIEWPORT_LABEL: Record<CaptureViewport, string> = {
  desktop: 'Desktop',
  tablet: 'Tablet',
  mobile: 'Mobile',
}

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

/** Phases of a single-viewport capture, driven by the screenshotter's /screenshot/stream SSE events. */
export type CapturePhase = 'idle' | 'connecting' | 'started' | 'measured' | 'done' | 'error'

export interface ViewportProgress {
  phase: CapturePhase
  /** Page height in CSS pixels, known once 'measured' fires — used to estimate remaining scroll/screenshot time. */
  scrollHeight?: number
  /** Timestamp (ms) when this phase began, for animating progress toward the next phase's target. */
  phaseStartedAt: number
}

/** Initial progress state for a viewport that hasn't started capturing yet. */
export function idleProgress(): ViewportProgress {
  return { phase: 'idle', phaseStartedAt: 0 }
}

/** Typical duration (seconds) of the 'connecting'/'started' phases — shapes the progress creep before real timing data is known. */
const CAPTURE_EXPECTED_DURATION = 8

const PHASE_START_PERCENT: Record<CapturePhase, number> = {
  idle: 0,
  connecting: 0,
  started: 8,
  measured: 85,
  done: 100,
  error: 0,
}

const PHASE_TARGET_PERCENT: Record<CapturePhase, number> = {
  idle: 0,
  connecting: 8,
  started: 85,
  measured: 98,
  done: 100,
  error: 0,
}

/**
 * Progress bar fill percentage for a single viewport. 'idle' and 'done' are exact; the
 * 'connecting', 'started', and 'measured' phases creep asymptotically from the phase's
 * start percent toward the next phase's target, capped at 90% of that gap so the bar
 * never visually reaches a checkpoint before the real SSE event arrives. Once 'measured'
 * fires, the known `scrollHeight` gives a real estimate for the remaining scroll +
 * screenshot time (the screenshotter scrolls in 400px steps every 150ms, plus ~1s overhead).
 */
export function viewportProgressPercent(progress: ViewportProgress, now: number): number {
  const { phase, phaseStartedAt, scrollHeight } = progress
  if (phase === 'idle' || phase === 'error') return 0
  if (phase === 'done') return 100

  const start = PHASE_START_PERCENT[phase]
  const target = PHASE_TARGET_PERCENT[phase]
  const elapsedSeconds = Math.max(0, (now - phaseStartedAt) / 1000)

  let expectedDuration = CAPTURE_EXPECTED_DURATION
  if (phase === 'connecting') expectedDuration = 1.5
  else if (phase === 'measured' && scrollHeight) expectedDuration = (Math.ceil(scrollHeight / 400) * 150 + 1000) / 1000

  const t = 1 - Math.exp(-elapsedSeconds / expectedDuration)
  return start + (target - start) * t * 0.9
}

/** Average progress across all viewports in the active capture set. */
export function overallProgressPercent(progresses: ViewportProgress[], now: number): number {
  if (progresses.length === 0) return 0
  const sum = progresses.reduce((acc, p) => acc + viewportProgressPercent(p, now), 0)
  return sum / progresses.length
}

/** Short status label for the current capture phase. */
export function viewportPhaseLabel(phase: CapturePhase): string {
  switch (phase) {
    case 'connecting': return 'Connecting…'
    case 'started': return 'Loading page…'
    case 'measured': return 'Rendering…'
    case 'done': return 'Done'
    case 'error': return 'Failed'
    default: return 'Waiting…'
  }
}

/** Ticks a reactive `now` timestamp while a capture is in flight, so progress bars can animate the creep between SSE events. */
export function useProgressTick() {
  const now = ref(Date.now())
  let interval: ReturnType<typeof setInterval> | null = null

  function start() {
    stop()
    now.value = Date.now()
    interval = setInterval(() => { now.value = Date.now() }, 150)
  }

  function stop() {
    if (interval) {
      clearInterval(interval)
      interval = null
    }
  }

  onScopeDispose(stop)

  return { now, start, stop }
}

function base64ToBlob(base64: string, mime: string): Blob {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const el = new Image()
    el.onload = () => resolve(el)
    el.onerror = reject
    el.src = src
  })
}

/**
 * Captures a single viewport locally, via the Electron main process
 * (electron/capture.cjs, exposed through the preload bridge as
 * `window.snipfolioCapture`) — a Playwright browser running in-process,
 * ported from ~/snipfolio-screenshotter. Reports real progress events
 * ('started', 'measured') as they arrive, and resolves with the final image.
 * Throws on capture failure, or (with `err.name === 'AbortError'`) if
 * `signal` is aborted.
 */
export async function captureViewportSSE(
  url: string,
  viewport: CaptureViewport,
  onProgress: (progress: ViewportProgress) => void,
  signal?: AbortSignal,
): Promise<{ img: HTMLImageElement; src: string }> {
  if (signal?.aborted) throw new DOMException('The operation was aborted.', 'AbortError')

  const { promise, cancel } = window.snipfolioCapture.captureUrl(
    url,
    viewport,
    1,
    (progress) => onProgress(progress as ViewportProgress),
  )

  const onAbort = () => cancel()
  signal?.addEventListener('abort', onAbort)

  let result: { image: string }
  try {
    result = await promise
  } catch (err) {
    if (signal?.aborted) throw new DOMException('The operation was aborted.', 'AbortError')
    throw err instanceof Error ? err : new Error('Capture failed')
  } finally {
    signal?.removeEventListener('abort', onAbort)
  }

  const blob = base64ToBlob(result.image, 'image/png')
  const src = URL.createObjectURL(blob)
  const img = await loadImage(src)
  onProgress({ phase: 'done', phaseStartedAt: Date.now() })
  return { img, src }
}
