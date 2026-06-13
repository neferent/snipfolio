import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useSnipsStore } from '~/stores/snips'
import { useSourcesStore } from '~/stores/sources'
import { useExport } from '~/composables/useExport'
import type { Snip, Composition, BackgroundConfig } from '~/types'

const toastCalls: { level: string; msg: string }[] = []
vi.mock('~/composables/useToast', () => ({
  toast: {
    error: (msg: string) => { toastCalls.push({ level: 'error', msg }) },
    success: (msg: string) => { toastCalls.push({ level: 'success', msg }) },
    warning: (msg: string) => { toastCalls.push({ level: 'warning', msg }) },
    info: (msg: string) => { toastCalls.push({ level: 'info', msg }) },
  },
}))

const background: BackgroundConfig = {
  type: 'solid', color: '#000', gradientStart: '#000', gradientEnd: '#000', gradientAngle: 0,
}

function makeSnip(overrides: Partial<Snip> = {}): Snip {
  return {
    id: 'snip-1', projectId: 'proj-1', sourceImageId: 'src-1',
    label: 'Snip 1', x: 0, y: 0, width: 100, height: 100, sortOrder: 0,
    ...overrides,
  }
}

function makeComposition(overrides: Partial<Composition> = {}): Composition {
  return {
    id: 'comp-1', projectId: 'proj-1', name: 'My Comp', type: 'laptop',
    config: { slots: [], background, outputWidth: 1920, outputHeight: 1080 },
    sortOrder: 0,
    ...overrides,
  }
}

beforeEach(() => {
  setActivePinia(createPinia())
  toastCalls.length = 0
})

describe('useExport.exportComposition', () => {
  it('rejects an empty composition without touching the canvas', async () => {
    const { exportComposition } = useExport()
    const ok = await exportComposition(makeComposition())
    expect(ok).toBe(false)
    expect(toastCalls).toHaveLength(1)
    expect(toastCalls[0]!.msg).toContain('empty')
  })

  it('rejects a composition whose source images have not loaded yet', async () => {
    useSnipsStore().addSnip(makeSnip({ id: 'snip-1', sourceImageId: 'src-1' }))
    const comp = makeComposition({
      config: {
        slots: [{ id: 'slot-1', snipId: 'snip-1', deviceFrame: 'none', x: 0, y: 0, width: 100, height: 100 }],
        background,
        outputWidth: 1920,
        outputHeight: 1080,
      },
    })
    const { exportComposition } = useExport()
    const ok = await exportComposition(comp)
    expect(ok).toBe(false)
    expect(toastCalls).toHaveLength(1)
    expect(toastCalls[0]!.msg).toContain('still loading')
  })
})

describe('useExport.exportSnipRaw', () => {
  it('reports an error when the snip has no loaded source image', () => {
    useSnipsStore().addSnip(makeSnip({ id: 'snip-1', sourceImageId: 'src-missing' }))
    const { exportSnipRaw } = useExport()
    const ok = exportSnipRaw(useSnipsStore().snips[0]!)
    expect(ok).toBe(false)
    expect(toastCalls).toHaveLength(1)
    expect(toastCalls[0]!.msg).toContain('no loaded source image')
  })
})

describe('useExport batch helpers', () => {
  it('exportAllSnipsRaw does not show a summary toast when every export fails individually', async () => {
    useSnipsStore().addSnip(makeSnip({ id: 'snip-1', sourceImageId: 'src-missing' }))
    useSnipsStore().addSnip(makeSnip({ id: 'snip-2', sourceImageId: 'src-missing' }))
    const { exportAllSnipsRaw } = useExport()
    await exportAllSnipsRaw()
    // Each failure already toasted individually; no extra batch summary.
    expect(toastCalls.filter((c) => c.level === 'warning')).toHaveLength(0)
    expect(toastCalls.filter((c) => c.level === 'error')).toHaveLength(2)
  })
})

// sanity check the store starts with no loaded images, used implicitly above
describe('sourcesStore fixture sanity', () => {
  it('has no loaded images by default', () => {
    expect(useSourcesStore().loadedImages.size).toBe(0)
  })
})
