import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useSnipsStore } from '~/stores/snips'
import { useProjectStore } from '~/stores/project'
import { useSourcesStore } from '~/stores/sources'
import { useSnips } from '~/composables/useSnips'

vi.mock('~/composables/useProject', () => ({
  useProject: () => ({ scheduleSave: vi.fn() }),
}))

beforeEach(() => {
  setActivePinia(createPinia())

  // Every createSnip call needs a current project
  const projectStore = useProjectStore()
  projectStore.setProject({
    id: 'proj-1', userId: 'user-1', name: 'Test',
    createdAt: '2024-01-01', updatedAt: '2024-01-01',
  })
})

describe('useSnips.createSnip', () => {
  it('adds the snip to the store', () => {
    const { createSnip } = useSnips()
    createSnip(10, 20, 100, 200)
    expect(useSnipsStore().snips).toHaveLength(1)
  })

  it('stores the correct coordinates rounded to integers', () => {
    const { createSnip } = useSnips()
    createSnip(10.7, 20.3, 99.9, 199.1)
    const snip = useSnipsStore().snips[0]!
    expect(snip.x).toBe(11)
    expect(snip.y).toBe(20)
    expect(snip.width).toBe(100)
    expect(snip.height).toBe(199)
  })

  it('assigns the active sourceImageId', () => {
    const sources = useSourcesStore()
    sources.setActiveSource('src-abc')
    const { createSnip } = useSnips()
    createSnip(0, 0, 50, 50)
    expect(useSnipsStore().snips[0]?.sourceImageId).toBe('src-abc')
  })

  it('defaults sourceImageId to "default" when no active source', () => {
    const { createSnip } = useSnips()
    createSnip(0, 0, 50, 50)
    expect(useSnipsStore().snips[0]?.sourceImageId).toBe('default')
  })

  it('sets the correct projectId', () => {
    const { createSnip } = useSnips()
    createSnip(0, 0, 50, 50)
    expect(useSnipsStore().snips[0]?.projectId).toBe('proj-1')
  })

  it('auto-selects the new snip', () => {
    const { createSnip } = useSnips()
    createSnip(0, 0, 50, 50)
    const store = useSnipsStore()
    expect(store.selectedSnipId).toBe(store.snips[0]?.id)
  })

  it('stores the snapFrame', () => {
    const { createSnip } = useSnips()
    createSnip(0, 0, 100, 100, 'laptop')
    expect(useSnipsStore().snips[0]?.snapFrame).toBe('laptop')
  })

  it('uses incrementing auto-labels', () => {
    const { createSnip } = useSnips()
    createSnip(0, 0, 50, 50)
    createSnip(0, 0, 50, 50)
    const snips = useSnipsStore().snips
    expect(snips[0]?.label).toBe('Snip 1')
    expect(snips[1]?.label).toBe('Snip 2')
  })
})

describe('useSnips.updateLabel', () => {
  it('updates the snip label', () => {
    const { createSnip, updateLabel } = useSnips()
    createSnip(0, 0, 50, 50)
    const id = useSnipsStore().snips[0]!.id
    updateLabel(id, 'Hero shot')
    expect(useSnipsStore().snips[0]?.label).toBe('Hero shot')
  })

  it('does not affect other snips', () => {
    const { createSnip, updateLabel } = useSnips()
    createSnip(0, 0, 50, 50)
    createSnip(0, 0, 50, 50)
    const [first, second] = useSnipsStore().snips
    updateLabel(first!.id, 'Changed')
    expect(useSnipsStore().snips.find((s) => s.id === second!.id)?.label).toBe('Snip 2')
  })
})

describe('useSnips.createFullSourceSnip', () => {
  beforeEach(() => {
    const sources = useSourcesStore()
    sources.setSources([
      { id: 'src-1', projectId: 'proj-1', label: 'Desktop', filename: 'a.png', width: 1600, height: 6000, sortOrder: 0 },
    ])
    sources.setActiveSource('src-1')
  })

  it('returns null when there is no active source', () => {
    const sources = useSourcesStore()
    sources.setActiveSource(null)
    const { createFullSourceSnip } = useSnips()
    expect(createFullSourceSnip('laptop')).toBeNull()
  })

  it('spans the full source width and sets isFullSource', () => {
    const { createFullSourceSnip } = useSnips()
    const snip = createFullSourceSnip('laptop')!
    expect(snip.x).toBe(0)
    expect(snip.y).toBe(0)
    expect(snip.width).toBe(1600)
    expect(snip.isFullSource).toBe(true)
    expect(snip.snapFrame).toBe('laptop')
  })

  it('computes height from the frame aspect ratio', () => {
    const { createFullSourceSnip } = useSnips()
    const snip = createFullSourceSnip('laptop')!
    const expectedHeight = Math.round(1600 / (3034.7 / 1964.07))
    expect(snip.height).toBe(expectedHeight)
  })

  it('clamps height to the source height when the source is shorter than the viewport', () => {
    const sources = useSourcesStore()
    sources.setSources([
      { id: 'src-2', projectId: 'proj-1', label: 'Short', filename: 'b.png', width: 1600, height: 500, sortOrder: 0 },
    ])
    sources.setActiveSource('src-2')
    const { createFullSourceSnip } = useSnips()
    const snip = createFullSourceSnip('laptop')!
    expect(snip.height).toBe(500)
  })

  it('auto-selects the new snip', () => {
    const { createFullSourceSnip } = useSnips()
    const snip = createFullSourceSnip('phone')!
    expect(useSnipsStore().selectedSnipId).toBe(snip.id)
  })
})

describe('useSnips.updateScrollOffset', () => {
  beforeEach(() => {
    const sources = useSourcesStore()
    sources.setSources([
      { id: 'src-1', projectId: 'proj-1', label: 'Desktop', filename: 'a.png', width: 1600, height: 6000, sortOrder: 0 },
    ])
    sources.setActiveSource('src-1')
  })

  it('updates y within bounds', () => {
    const { createFullSourceSnip, updateScrollOffset } = useSnips()
    const snip = createFullSourceSnip('laptop')!
    updateScrollOffset(snip.id, 100)
    expect(useSnipsStore().snips[0]?.y).toBe(100)
  })

  it('clamps to 0 when given a negative value', () => {
    const { createFullSourceSnip, updateScrollOffset } = useSnips()
    const snip = createFullSourceSnip('laptop')!
    updateScrollOffset(snip.id, -50)
    expect(useSnipsStore().snips[0]?.y).toBe(0)
  })

  it('clamps to source.height - snip.height at the maximum', () => {
    const { createFullSourceSnip, updateScrollOffset } = useSnips()
    const snip = createFullSourceSnip('laptop')!
    const maxY = 6000 - snip.height
    updateScrollOffset(snip.id, 999999)
    expect(useSnipsStore().snips[0]?.y).toBe(maxY)
  })

  it('rounds fractional values', () => {
    const { createFullSourceSnip, updateScrollOffset } = useSnips()
    const snip = createFullSourceSnip('laptop')!
    updateScrollOffset(snip.id, 100.6)
    expect(useSnipsStore().snips[0]?.y).toBe(101)
  })
})

describe('useSnips.deleteSnip', () => {
  it('removes the snip from the store', () => {
    const { createSnip, deleteSnip } = useSnips()
    createSnip(0, 0, 50, 50)
    const id = useSnipsStore().snips[0]!.id
    deleteSnip(id)
    expect(useSnipsStore().snips).toHaveLength(0)
  })

  it('clears selectedSnipId when the selected snip is deleted', () => {
    const { createSnip, deleteSnip } = useSnips()
    createSnip(0, 0, 50, 50)
    const id = useSnipsStore().snips[0]!.id
    deleteSnip(id)
    expect(useSnipsStore().selectedSnipId).toBeNull()
  })
})
