import {
  CAPTURE_PRESETS,
  captureViewportSSE,
  idleProgress,
  useProgressTick,
  VIEWPORT_SCREEN_ASPECT,
  VIEWPORT_SNAP_FRAME,
} from '~/composables/useUrlCapture'
import type { CaptureViewport, CapturePreset, ViewportProgress } from '~/composables/useUrlCapture'
import { useSourcesStore } from '~/stores/sources'
import { useSnips } from '~/composables/useSnips'
import { useProject } from '~/composables/useProject'
import { useCompositions } from '~/composables/useCompositions'
import { useAuthStore } from '~/stores/auth'
import type { Composition, SourceImage, BackgroundConfig } from '~/types'

export type CaptureStatus = 'idle' | 'loading' | 'done' | 'error'

export interface CapturedImage {
  img: HTMLImageElement
  src: string
}

export interface PlacedSnip {
  snipId: string
  width: number
  height: number
}

/** Shared state machine for the "From URL" capture flow: preset selection, per-viewport capture progress, and the resulting source/snip/composition creation. */
export function useUrlCaptureFlow() {
  const sourcesStore = useSourcesStore()
  const { createSnip } = useSnips()
  const { saveImage } = useProject()
  const { createLaptopComposition, createLaptopPhoneComposition, createLaptopTabletPhoneComposition, createBrowserComposition } = useCompositions()
  const authStore = useAuthStore()

  const preset = ref<CapturePreset>('laptop+phone')
  const captureState = reactive<Record<CaptureViewport, { status: CaptureStatus; src: string; progress: ViewportProgress }>>({
    desktop: { status: 'idle', src: '', progress: idleProgress() },
    tablet: { status: 'idle', src: '', progress: idleProgress() },
    mobile: { status: 'idle', src: '', progress: idleProgress() },
  })
  const captureError = ref('')
  const { now: tickNow, start: startTick, stop: stopTick } = useProgressTick()

  let captureAbortController: AbortController | null = null
  let captureCancelled = false

  const activeViewports = computed(() => CAPTURE_PRESETS.find((p) => p.id === preset.value)?.viewports ?? [])

  function resetCaptureState() {
    for (const viewport of (['desktop', 'tablet', 'mobile'] as const)) {
      captureState[viewport].status = 'idle'
      captureState[viewport].src = ''
      captureState[viewport].progress = idleProgress()
    }
  }

  /** Resets preset selection and capture state, e.g. when the modal closes. */
  function reset() {
    preset.value = 'laptop+phone'
    resetCaptureState()
    captureError.value = ''
    captureAbortController?.abort()
    captureAbortController = null
    captureCancelled = false
    stopTick()
  }

  /** Aborts an in-flight capture and clears progress, without resetting the preset selection. */
  function cancel() {
    captureCancelled = true
    captureAbortController?.abort()
    captureAbortController = null
    stopTick()
    resetCaptureState()
    captureError.value = ''
  }

  async function captureOne(url: string, viewport: CaptureViewport): Promise<CapturedImage | null> {
    captureState[viewport].status = 'loading'
    captureState[viewport].progress = { phase: 'connecting', phaseStartedAt: Date.now() }
    try {
      const result = await captureViewportSSE(
        url,
        viewport,
        authStore.token ?? '',
        (progress) => { captureState[viewport].progress = progress },
        captureAbortController?.signal,
      )
      captureState[viewport].status = 'done'
      captureState[viewport].src = result.src
      return result
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return null
      captureState[viewport].status = 'error'
      return null
    }
  }

  /**
   * Captures every viewport in the active preset, sequentially. Returns `null` if cancelled
   * partway through, otherwise the map of successful captures (and sets `captureError` if none succeeded).
   */
  async function runCapture(url: string): Promise<Map<CaptureViewport, CapturedImage> | null> {
    captureCancelled = false
    captureAbortController = new AbortController()
    resetCaptureState()
    captureError.value = ''
    startTick()

    const viewports = activeViewports.value
    const captured = new Map<CaptureViewport, CapturedImage>()

    for (const viewport of viewports) {
      const result = await captureOne(url, viewport)
      if (captureCancelled) break
      if (result) captured.set(viewport, result)
    }

    stopTick()

    if (captureCancelled) return null

    if (captured.size === 0) {
      captureError.value = viewports.length > 1
        ? 'All captures failed. Check the URL and try again.'
        : 'Capture failed. Check the URL and try again.'
    }

    return captured
  }

  /** Registers a captured screenshot as a source image and creates a matching snip cropped to that viewport's frame aspect. */
  function addCapturedSource(
    projectId: string,
    viewport: CaptureViewport,
    capture: CapturedImage,
    sortOrder: number,
    hostname: string,
  ): PlacedSnip {
    const sourceId = crypto.randomUUID()
    const source: SourceImage = {
      id: sourceId,
      projectId,
      label: `${hostname} ${viewport}`,
      filename: `${hostname}-${viewport}.png`,
      width: capture.img.naturalWidth,
      height: capture.img.naturalHeight,
      sortOrder,
    }
    sourcesStore.addSource(source)
    sourcesStore.setLoadedImage(sourceId, capture.img, capture.src)
    sourcesStore.setActiveSource(sourceId)
    saveImage(projectId, sourceId, capture.src)
    const width = capture.img.naturalWidth
    const height = Math.min(capture.img.naturalHeight, Math.round(width / VIEWPORT_SCREEN_ASPECT[viewport]))
    const snip = createSnip(0, 0, width, height, VIEWPORT_SNAP_FRAME[viewport], sourceId)
    return { snipId: snip.id, width, height }
  }

  /** Builds the composition matching the currently-selected preset from the placed snips. */
  function createCompositionFromPreset(
    placed: Map<CaptureViewport, PlacedSnip>,
    hostname: string,
    resolvedUrl: string,
    name?: string,
    bg?: Partial<BackgroundConfig>,
  ): Composition {
    const desktop = placed.get('desktop')
    const tablet = placed.get('tablet')
    const mobile = placed.get('mobile')

    if (preset.value === 'laptop+tablet+phone' && desktop && tablet && mobile) {
      return createLaptopTabletPhoneComposition(desktop.snipId, tablet.snipId, mobile.snipId, name ?? hostname, bg)
    }
    if ((preset.value === 'browser' || preset.value === 'browser+url') && desktop) {
      const browserUrl = preset.value === 'browser+url' ? resolvedUrl.replace(/^https?:\/\//, '') : undefined
      return createBrowserComposition(desktop.snipId, desktop.width, desktop.height, name ?? hostname, bg, browserUrl)
    }
    if (desktop && mobile) {
      return createLaptopPhoneComposition(desktop.snipId, mobile.snipId, name ?? hostname, bg)
    }
    const fallback = desktop ?? tablet ?? mobile
    return createLaptopComposition(fallback!.snipId, name ?? hostname, bg)
  }

  return {
    preset,
    captureState,
    captureError,
    activeViewports,
    tickNow,
    resetCaptureState,
    reset,
    cancel,
    runCapture,
    addCapturedSource,
    createCompositionFromPreset,
  }
}
