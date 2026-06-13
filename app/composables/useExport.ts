import { useCanvasRenderer } from '~/composables/useCanvasRenderer'
import { useSnipsStore } from '~/stores/snips'
import { useCompositionsStore } from '~/stores/compositions'
import { useSourcesStore } from '~/stores/sources'
import { toast } from '~/composables/useToast'
import type { Composition, Snip } from '~/types'

function sanitizeFilename(name: string) {
  return name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_-]/g, '')
}

function downloadCanvas(canvas: HTMLCanvasElement, filename: string): Promise<void> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Export produced an empty file. Try a smaller output size.'))
        return
      }
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
      resolve()
    }, 'image/png')
  })
}

async function copyCanvasToClipboard(canvas: HTMLCanvasElement): Promise<void> {
  if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
    throw new Error('Copying images is not supported in this browser.')
  }
  // Pass a Promise<Blob> rather than awaiting first, so Safari can attribute
  // the clipboard write to the click gesture that triggered it.
  const item = new ClipboardItem({
    'image/png': new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Could not generate image for clipboard.'))
      }, 'image/png')
    }),
  })
  await navigator.clipboard.write([item])
}

export function useExport() {
  const { render } = useCanvasRenderer()
  const snipsStore = useSnipsStore()
  const compositionsStore = useCompositionsStore()
  const sourcesStore = useSourcesStore()

  function buildSnipCanvas(snip: Snip): HTMLCanvasElement {
    const loaded = sourcesStore.getImage(snip.sourceImageId)
    if (!loaded) throw new Error(`"${snip.label}" has no loaded source image.`)
    const canvas = document.createElement('canvas')
    canvas.width = snip.width
    canvas.height = snip.height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D context unavailable')
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(loaded.img, snip.x, snip.y, snip.width, snip.height, 0, 0, snip.width, snip.height)
    return canvas
  }

  function buildSourceImagesMap(): Map<string, HTMLImageElement> {
    const map = new Map<string, HTMLImageElement>()
    for (const [id, { img }] of sourcesStore.loadedImages) {
      map.set(id, img)
    }
    return map
  }

  function renderComposition(composition: Composition, watermark = true): HTMLCanvasElement {
    if (composition.config.slots.length === 0) {
      throw new Error(`"${composition.name}" is empty — add a snip before exporting.`)
    }
    const stillLoading = composition.config.slots.some((slot) => {
      const snip = snipsStore.snips.find((s) => s.id === slot.snipId)
      return snip && !sourcesStore.loadedImages.has(snip.sourceImageId)
    })
    if (stillLoading) {
      throw new Error(`"${composition.name}" has images still loading — wait a moment and try again.`)
    }
    const canvas = document.createElement('canvas')
    try {
      render(canvas, {
        composition,
        snips: snipsStore.snips,
        sourceImages: buildSourceImagesMap(),
        watermark,
      })
    } catch {
      throw new Error(`Could not render "${composition.name}". Check that its images loaded correctly.`)
    }
    return canvas
  }

  async function exportComposition(composition: Composition, watermark = true): Promise<boolean> {
    try {
      const canvas = renderComposition(composition, watermark)
      const name = `snipfolio_${sanitizeFilename(composition.name)}.png`
      await downloadCanvas(canvas, name)
      return true
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Export failed')
      return false
    }
  }

  async function exportAllCompositions(watermark = true) {
    const compositions = compositionsStore.compositions
    const results = await Promise.all(
      compositions.map((comp, i) =>
        new Promise<boolean>((resolve) => {
          setTimeout(() => exportComposition(comp, watermark).then(resolve), i * 200)
        }),
      ),
    )
    reportBatchResult(results, compositions.map((c) => c.name))
  }

  function exportSnipRaw(snip: Snip): boolean {
    try {
      const canvas = buildSnipCanvas(snip)
      const name = `snipfolio_snip_${sanitizeFilename(snip.label)}.png`
      downloadCanvas(canvas, name).catch((err) => {
        toast.error(err instanceof Error ? err.message : 'Export failed')
      })
      return true
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Export failed')
      return false
    }
  }

  async function copySnipToClipboard(snip: Snip): Promise<boolean> {
    try {
      const canvas = buildSnipCanvas(snip)
      await copyCanvasToClipboard(canvas)
      return true
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Copy failed')
      return false
    }
  }

  async function copyCompositionToClipboard(composition: Composition, watermark = true): Promise<boolean> {
    try {
      const canvas = renderComposition(composition, watermark)
      await copyCanvasToClipboard(canvas)
      return true
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Copy failed')
      return false
    }
  }

  async function exportAllSnipsRaw() {
    const snips = snipsStore.snips
    const results = await Promise.all(
      snips.map((snip, i) =>
        new Promise<boolean>((resolve) => {
          setTimeout(() => resolve(exportSnipRaw(snip)), i * 200)
        }),
      ),
    )
    reportBatchResult(results, snips.map((s) => s.label))
  }

  function reportBatchResult(results: boolean[], names: string[]) {
    if (results.length === 0) return
    const failed = names.filter((_, i) => !results[i])
    if (failed.length === 0) {
      if (results.length > 1) toast.success(`Exported ${results.length} files`)
      return
    }
    if (failed.length === results.length) return // individual errors already toasted
    toast.warning(`Exported ${results.length - failed.length}/${results.length} files`, {
      description: `Failed: ${failed.join(', ')}`,
    })
  }

  return { exportComposition, exportAllCompositions, exportSnipRaw, exportAllSnipsRaw, copySnipToClipboard, copyCompositionToClipboard }
}
