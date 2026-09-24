// Renderer-facing capture API exposed by electron/preload.cjs via
// contextBridge — see app/composables/useUrlCapture.ts for the consumer.
interface SnipfolioCaptureProgress {
  requestId?: string
  phase: 'started' | 'measured'
  scrollHeight?: number
  phaseStartedAt: number
}

interface SnipfolioCaptureBridge {
  captureUrl(
    url: string,
    viewport: 'desktop' | 'tablet' | 'mobile',
    deviceScaleFactor: number,
    onProgress: (progress: SnipfolioCaptureProgress) => void,
  ): { promise: Promise<{ image: string }>; cancel: () => void }
}

interface Window {
  snipfolioCapture: SnipfolioCaptureBridge
}
