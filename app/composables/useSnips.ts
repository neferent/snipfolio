import { useSnipsStore } from '~/stores/snips'
import { useProjectStore } from '~/stores/project'
import { useSourcesStore } from '~/stores/sources'
import { useProject } from '~/composables/useProject'
import type { Snip } from '~/types'

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

  return { createSnip, updateLabel, deleteSnip, extractSnipCanvas }
}
