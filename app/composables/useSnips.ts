import { useSnipsStore } from '~/stores/snips'
import { useProjectStore } from '~/stores/project'
import { useSourcesStore } from '~/stores/sources'
import { useProject } from '~/composables/useProject'
import { FRAME_SCREEN_ASPECT } from '~/composables/useFrameMismatches'
import type { Snip } from '~/types'

const FULL_SOURCE_FRAME_LABEL: Record<'laptop' | 'tablet' | 'phone', string> = {
  laptop: 'Desktop',
  tablet: 'Tablet',
  phone: 'Mobile',
}

export function useSnips() {
  const store = useSnipsStore()
  const projectStore = useProjectStore()
  const sourcesStore = useSourcesStore()
  const { scheduleSave } = useProject()

  function createSnip(x: number, y: number, width: number, height: number, snapFrame?: 'laptop' | 'phone' | 'tablet' | null, sourceImageId?: string): Snip {
    const snip: Snip = {
      id: crypto.randomUUID(),
      projectId: projectStore.current!.id,
      sourceImageId: sourceImageId ?? sourcesStore.activeSourceId ?? 'default',
      label: store.nextLabel(),
      x: Math.round(x),
      y: Math.round(y),
      width: Math.round(width),
      height: Math.round(height),
      sortOrder: store.snips.length,
      snapFrame: snapFrame ?? null,
    }
    store.addSnip(snip)
    store.selectSnip(snip.id)
    scheduleSave()
    return snip
  }

  function updateLabel(id: string, label: string) {
    store.updateSnip(id, { label })
    scheduleSave()
  }

  // Creates a "full source" snip: spans the full width of the source, with a
  // height matching the chosen frame's screen aspect ratio. The snip's `y`
  // then acts as a scroll offset, adjustable via the "Scroll position" control.
  function createFullSourceSnip(frame: 'laptop' | 'tablet' | 'phone', sourceImageId?: string): Snip | null {
    const srcId = sourceImageId ?? sourcesStore.activeSourceId
    const source = srcId ? sourcesStore.sources.find((s) => s.id === srcId) : undefined
    if (!srcId || !source) return null

    const aspect = FRAME_SCREEN_ASPECT[frame]!
    const height = Math.min(source.height, Math.round(source.width / aspect))

    const snip: Snip = {
      id: crypto.randomUUID(),
      projectId: projectStore.current!.id,
      sourceImageId: srcId,
      label: `${FULL_SOURCE_FRAME_LABEL[frame]} (full source)`,
      x: 0,
      y: 0,
      width: source.width,
      height,
      sortOrder: store.snips.length,
      snapFrame: frame,
      isFullSource: true,
    }
    store.addSnip(snip)
    store.selectSnip(snip.id)
    scheduleSave()
    return snip
  }

  // Updates the vertical scroll offset (`y`) of a full-source snip, clamped
  // so the viewport (snip.height) stays within the source's bounds.
  function updateScrollOffset(id: string, y: number) {
    const snip = store.snips.find((s) => s.id === id)
    if (!snip) return
    const source = sourcesStore.sources.find((s) => s.id === snip.sourceImageId)
    const maxY = source ? Math.max(0, source.height - snip.height) : Math.max(0, y)
    const clamped = Math.round(Math.min(Math.max(0, y), maxY))
    store.updateSnip(id, { y: clamped })
    scheduleSave()
  }

  function deleteSnip(id: string) {
    store.removeSnip(id)
    scheduleSave()
  }

  function extractSnipCanvas(snip: Snip, source: HTMLImageElement): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    canvas.width = snip.width
    canvas.height = snip.height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D context unavailable')
    ctx.drawImage(source, snip.x, snip.y, snip.width, snip.height, 0, 0, snip.width, snip.height)
    return canvas
  }

  return { createSnip, updateLabel, deleteSnip, extractSnipCanvas, createFullSourceSnip, updateScrollOffset }
}
