import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useCompositionsStore } from '~/stores/compositions'
import { useProjectStore } from '~/stores/project'
import { useSnipsStore } from '~/stores/snips'
import { useCompositions } from '~/composables/useCompositions'
import { isFreeformConfig, isCollageConfig } from '~/types'
import type { Snip } from '~/types'

vi.mock('~/composables/useProject', () => ({
  useProject: () => ({ scheduleSave: vi.fn(), deleteCompositionRecord: vi.fn() }),
}))

function makeSnip(id: string, w = 1920, h = 1080): Snip {
  return {
    id, projectId: 'proj-1', sourceImageId: 'src-1',
    label: id, x: 0, y: 0, width: w, height: h, sortOrder: 0,
  }
}

beforeEach(() => {
  setActivePinia(createPinia())
  useProjectStore().setProject({
    id: 'proj-1', userId: 'user-1', name: 'Test',
    createdAt: '2024-01-01', updatedAt: '2024-01-01',
  })
})

describe('useCompositions.createLaptopComposition', () => {
  it('adds a composition to the store', () => {
    useSnipsStore().addSnip(makeSnip('snip-1'))
    const { createLaptopComposition } = useCompositions()
    createLaptopComposition('snip-1')
    expect(useCompositionsStore().compositions).toHaveLength(1)
  })

  it('creates a freeform config with one laptop slot', () => {
    useSnipsStore().addSnip(makeSnip('snip-1'))
    const { createLaptopComposition } = useCompositions()
    const comp = createLaptopComposition('snip-1')
    expect(isFreeformConfig(comp.config)).toBe(true)
    if (isFreeformConfig(comp.config)) {
      expect(comp.config.slots).toHaveLength(1)
      expect(comp.config.slots[0]?.deviceFrame).toBe('laptop')
      expect(comp.config.slots[0]?.snipId).toBe('snip-1')
    }
  })

  it('uses the provided name', () => {
    useSnipsStore().addSnip(makeSnip('snip-1'))
    const { createLaptopComposition } = useCompositions()
    const comp = createLaptopComposition('snip-1', 'My Hero Shot')
    expect(comp.name).toBe('My Hero Shot')
  })

  it('defaults name to "Desktop"', () => {
    useSnipsStore().addSnip(makeSnip('snip-1'))
    const { createLaptopComposition } = useCompositions()
    const comp = createLaptopComposition('snip-1')
    expect(comp.name).toBe('Desktop')
  })

  it('applies background override', () => {
    useSnipsStore().addSnip(makeSnip('snip-1'))
    const { createLaptopComposition } = useCompositions()
    const comp = createLaptopComposition('snip-1', undefined, { color: '#ff0000' })
    if (isFreeformConfig(comp.config)) {
      expect(comp.config.background.color).toBe('#ff0000')
    }
  })

  it('sets outputWidth and outputHeight to 1920×1080', () => {
    useSnipsStore().addSnip(makeSnip('snip-1'))
    const { createLaptopComposition } = useCompositions()
    const comp = createLaptopComposition('snip-1')
    expect(comp.config.outputWidth).toBe(1920)
    expect(comp.config.outputHeight).toBe(1080)
  })

  it('assigns the correct projectId', () => {
    useSnipsStore().addSnip(makeSnip('snip-1'))
    const { createLaptopComposition } = useCompositions()
    const comp = createLaptopComposition('snip-1')
    expect(comp.projectId).toBe('proj-1')
  })
})

describe('useCompositions.createAutoComposition', () => {
  it('creates a collage config', () => {
    const snips = useSnipsStore()
    snips.addSnip(makeSnip('s1'))
    snips.addSnip(makeSnip('s2'))
    const { createAutoComposition } = useCompositions()
    const comp = createAutoComposition(['s1', 's2'])
    expect(isCollageConfig(comp.config)).toBe(true)
  })

  it('includes all provided snip ids as slots', () => {
    const snips = useSnipsStore()
    snips.addSnip(makeSnip('s1'))
    snips.addSnip(makeSnip('s2'))
    snips.addSnip(makeSnip('s3'))
    const { createAutoComposition } = useCompositions()
    const comp = createAutoComposition(['s1', 's2', 's3'])
    if (isCollageConfig(comp.config)) {
      expect(comp.config.slots.map((s) => s.snipId)).toEqual(['s1', 's2', 's3'])
    }
  })

  it('defaults name to "Auto-Collage"', () => {
    const { createAutoComposition } = useCompositions()
    const comp = createAutoComposition([])
    expect(comp.name).toBe('Auto-Collage')
  })
})

describe('useCompositions.createFreeformComposition', () => {
  it('creates a freeform config', () => {
    useSnipsStore().addSnip(makeSnip('s1'))
    const { createFreeformComposition } = useCompositions()
    const comp = createFreeformComposition(['s1'])
    expect(isFreeformConfig(comp.config)).toBe(true)
  })

  it('creates one slot per snip', () => {
    const snips = useSnipsStore()
    snips.addSnip(makeSnip('s1'))
    snips.addSnip(makeSnip('s2'))
    const { createFreeformComposition } = useCompositions()
    const comp = createFreeformComposition(['s1', 's2'])
    if (isFreeformConfig(comp.config)) {
      expect(comp.config.slots).toHaveLength(2)
      expect(comp.config.slots.map((s) => s.snipId)).toEqual(['s1', 's2'])
    }
  })

  it('defaults all slot frames to "none"', () => {
    const snips = useSnipsStore()
    snips.addSnip(makeSnip('s1'))
    snips.addSnip(makeSnip('s2'))
    const { createFreeformComposition } = useCompositions()
    const comp = createFreeformComposition(['s1', 's2'])
    if (isFreeformConfig(comp.config)) {
      comp.config.slots.forEach((slot) => expect(slot.deviceFrame).toBe('none'))
    }
  })
})

describe('useCompositions.deleteComposition', () => {
  it('removes the composition from the store', () => {
    useSnipsStore().addSnip(makeSnip('s1'))
    const { createLaptopComposition, deleteComposition } = useCompositions()
    const comp = createLaptopComposition('s1')
    deleteComposition(comp.id)
    expect(useCompositionsStore().compositions).toHaveLength(0)
  })

  it('assigns incrementing sortOrder', () => {
    useSnipsStore().addSnip(makeSnip('s1'))
    const { createLaptopComposition } = useCompositions()
    const a = createLaptopComposition('s1', 'A')
    const b = createLaptopComposition('s1', 'B')
    expect(a.sortOrder).toBe(0)
    expect(b.sortOrder).toBe(1)
  })
})
