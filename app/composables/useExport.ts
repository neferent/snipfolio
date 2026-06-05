import { useCanvasRenderer } from '~/composables/useCanvasRenderer'
import { useSnipsStore } from '~/stores/snips'
import { useCompositionsStore } from '~/stores/compositions'
import { useSourcesStore } from '~/stores/sources'
import type { Composition, Snip } from '~/types'

function sanitizeFilename(name: string) {
  return name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_-]/g, '')
}

function downloadCanvas(canvas: HTMLCanvasElement, filename: string) {
  canvas.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }, 'image/png')
}

export function useExport() {
  const { render } = useCanvasRenderer()
  const snipsStore = useSnipsStore()
  const compositionsStore = useCompositionsStore()
  const sourcesStore = useSourcesStore()

  function buildSourceImagesMap(): Map<string, HTMLImageElement> {
    const map = new Map<string, HTMLImageElement>()
    for (const [id, { img }] of sourcesStore.loadedImages) {
      map.set(id, img)
    }
    return map
  }

  function renderComposition(composition: Composition): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    render(canvas, {
      composition,
      snips: snipsStore.snips,
      sourceImages: buildSourceImagesMap(),
    })
    return canvas
  }

  function exportComposition(composition: Composition) {
    const canvas = renderComposition(composition)
    const name = `snipfolio_${sanitizeFilename(composition.name)}.png`
    downloadCanvas(canvas, name)
  }

  function exportAllCompositions() {
    compositionsStore.compositions.forEach((comp, i) => {
      setTimeout(() => exportComposition(comp), i * 200)
    })
  }

  function exportSnipRaw(snip: Snip) {
    const loaded = sourcesStore.getImage(snip.sourceImageId)
    if (!loaded) return
    const canvas = document.createElement('canvas')
    canvas.width = snip.width
    canvas.height = snip.height
    const ctx = canvas.getContext('2d')!
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(loaded.img, snip.x, snip.y, snip.width, snip.height, 0, 0, snip.width, snip.height)
    const name = `snipfolio_snip_${sanitizeFilename(snip.label)}.png`
    downloadCanvas(canvas, name)
  }

  function exportAllSnipsRaw() {
    snipsStore.snips.forEach((snip, i) => {
      setTimeout(() => exportSnipRaw(snip), i * 200)
    })
  }

  return { exportComposition, exportAllCompositions, exportSnipRaw, exportAllSnipsRaw }
}
