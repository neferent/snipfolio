import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '~/stores/auth'
import { useProjectStore } from '~/stores/project'
import { useSnipsStore } from '~/stores/snips'
import { useCompositionsStore } from '~/stores/compositions'
import { useSourcesStore } from '~/stores/sources'
import type { Snip, Project, Composition, SourceImage } from '~/types'

function makeSnip(overrides: Partial<Snip> = {}): Snip {
  return {
    id: 'snip-1', projectId: 'proj-1', sourceImageId: 'src-1',
    label: 'Snip 1', x: 0, y: 0, width: 100, height: 100, sortOrder: 0,
    ...overrides,
  }
}

function makeComposition(overrides: Partial<Composition> = {}): Composition {
  return {
    id: 'comp-1', projectId: 'proj-1', name: 'Test', type: 'laptop',
    config: { slots: [], background: { type: 'solid', color: '#000', gradientStart: '#000', gradientEnd: '#000', gradientAngle: 0 }, outputWidth: 1920, outputHeight: 1080 },
    sortOrder: 0,
    ...overrides,
  }
}

function makeProject(overrides: Partial<Project> = {}): Project {
  return { id: 'proj-1', userId: 'user-1', name: 'Test', createdAt: '2024-01-01', updatedAt: '2024-01-01', ...overrides }
}

function makeSource(overrides: Partial<SourceImage> = {}): SourceImage {
  return { id: 'src-1', projectId: 'proj-1', label: 'Screenshot', filename: 'screen.png', width: 1920, height: 1080, sortOrder: 0, ...overrides }
}

beforeEach(() => {
  setActivePinia(createPinia())
})

// ─── auth store ──────────────────────────────────────────────────────────────

describe('authStore', () => {
  it('starts unauthenticated', () => {
    const store = useAuthStore()
    expect(store.isAuthenticated).toBe(false)
    expect(store.user).toBeNull()
  })

  // ensureLocalUser() is gated on import.meta.client (it reads/writes
  // localStorage), which is false under this Node test environment — so it's
  // a no-op here. Exercised for real by the auth.client plugin in the browser.
  it('user can be set directly, making isAuthenticated true', () => {
    const store = useAuthStore()
    store.user = { id: 'u1', email: '' }
    expect(store.isAuthenticated).toBe(true)
  })
})

// ─── project store ───────────────────────────────────────────────────────────

describe('projectStore', () => {
  it('starts with no current project', () => {
    const store = useProjectStore()
    expect(store.current).toBeNull()
  })

  it('setProject stores the project', () => {
    const store = useProjectStore()
    store.setProject(makeProject())
    expect(store.current?.id).toBe('proj-1')
  })

  it('setProject(null) clears current', () => {
    const store = useProjectStore()
    store.setProject(makeProject())
    store.setProject(null)
    expect(store.current).toBeNull()
  })

  it('setProjects stores the list', () => {
    const store = useProjectStore()
    store.setProjects([makeProject(), makeProject({ id: 'proj-2' })])
    expect(store.projects).toHaveLength(2)
  })

  it('setSaveStatus updates saveStatus', () => {
    const store = useProjectStore()
    store.setSaveStatus('saving')
    expect(store.saveStatus).toBe('saving')
    store.setSaveStatus('saved')
    expect(store.saveStatus).toBe('saved')
  })

  it('markUnsaved sets saveStatus to unsaved', () => {
    const store = useProjectStore()
    store.setSaveStatus('saved')
    store.markUnsaved()
    expect(store.saveStatus).toBe('unsaved')
  })
})

// ─── snips store ─────────────────────────────────────────────────────────────

describe('snipsStore', () => {
  it('starts empty', () => {
    const store = useSnipsStore()
    expect(store.snips).toHaveLength(0)
    expect(store.selectedSnip).toBeNull()
  })

  it('addSnip appends the snip', () => {
    const store = useSnipsStore()
    store.addSnip(makeSnip())
    expect(store.snips).toHaveLength(1)
  })

  it('updateSnip patches by id', () => {
    const store = useSnipsStore()
    store.addSnip(makeSnip())
    store.updateSnip('snip-1', { label: 'Renamed' })
    expect(store.snips[0]?.label).toBe('Renamed')
  })

  it('updateSnip ignores unknown id', () => {
    const store = useSnipsStore()
    store.addSnip(makeSnip())
    store.updateSnip('nonexistent', { label: 'X' })
    expect(store.snips[0]?.label).toBe('Snip 1')
  })

  it('removeSnip deletes by id', () => {
    const store = useSnipsStore()
    store.addSnip(makeSnip())
    store.removeSnip('snip-1')
    expect(store.snips).toHaveLength(0)
  })

  it('removeSnip clears selectedSnipId if it was selected', () => {
    const store = useSnipsStore()
    store.addSnip(makeSnip())
    store.selectSnip('snip-1')
    store.removeSnip('snip-1')
    expect(store.selectedSnipId).toBeNull()
  })

  it('removeSnip does not clear selectedSnipId for a different snip', () => {
    const store = useSnipsStore()
    store.addSnip(makeSnip({ id: 'snip-1' }))
    store.addSnip(makeSnip({ id: 'snip-2' }))
    store.selectSnip('snip-2')
    store.removeSnip('snip-1')
    expect(store.selectedSnipId).toBe('snip-2')
  })

  it('selectSnip sets selectedSnip', () => {
    const store = useSnipsStore()
    store.addSnip(makeSnip())
    store.selectSnip('snip-1')
    expect(store.selectedSnip?.id).toBe('snip-1')
  })

  it('orderedSnips sorts by sortOrder', () => {
    const store = useSnipsStore()
    store.addSnip(makeSnip({ id: 'b', sortOrder: 2 }))
    store.addSnip(makeSnip({ id: 'a', sortOrder: 1 }))
    store.addSnip(makeSnip({ id: 'c', sortOrder: 3 }))
    expect(store.orderedSnips.map((s) => s.id)).toEqual(['a', 'b', 'c'])
  })

  it('nextLabel returns Snip N+1', () => {
    const store = useSnipsStore()
    expect(store.nextLabel()).toBe('Snip 1')
    store.addSnip(makeSnip())
    expect(store.nextLabel()).toBe('Snip 2')
  })

  it('setDrawing toggles isDrawing', () => {
    const store = useSnipsStore()
    store.setDrawing(true)
    expect(store.isDrawing).toBe(true)
    store.setDrawing(false)
    expect(store.isDrawing).toBe(false)
  })
})

// ─── compositions store ──────────────────────────────────────────────────────

describe('compositionsStore', () => {
  it('starts empty', () => {
    const store = useCompositionsStore()
    expect(store.compositions).toHaveLength(0)
    expect(store.selected).toBeNull()
  })

  it('addComposition appends', () => {
    const store = useCompositionsStore()
    store.addComposition(makeComposition())
    expect(store.compositions).toHaveLength(1)
  })

  it('updateComposition patches by id', () => {
    const store = useCompositionsStore()
    store.addComposition(makeComposition())
    store.updateComposition('comp-1', { name: 'Renamed' })
    expect(store.compositions[0]?.name).toBe('Renamed')
  })

  it('updateComposition ignores unknown id', () => {
    const store = useCompositionsStore()
    store.addComposition(makeComposition())
    store.updateComposition('nonexistent', { name: 'X' })
    expect(store.compositions[0]?.name).toBe('Test')
  })

  it('removeComposition deletes by id', () => {
    const store = useCompositionsStore()
    store.addComposition(makeComposition())
    store.removeComposition('comp-1')
    expect(store.compositions).toHaveLength(0)
  })

  it('removeComposition clears selectedId if it was selected', () => {
    const store = useCompositionsStore()
    store.addComposition(makeComposition())
    store.selectComposition('comp-1')
    store.removeComposition('comp-1')
    expect(store.selectedId).toBeNull()
  })

  it('selectComposition sets selected', () => {
    const store = useCompositionsStore()
    store.addComposition(makeComposition())
    store.selectComposition('comp-1')
    expect(store.selected?.id).toBe('comp-1')
  })

  it('ordered sorts by sortOrder', () => {
    const store = useCompositionsStore()
    store.addComposition(makeComposition({ id: 'b', sortOrder: 2 }))
    store.addComposition(makeComposition({ id: 'a', sortOrder: 1 }))
    store.addComposition(makeComposition({ id: 'c', sortOrder: 3 }))
    expect(store.ordered.map((c) => c.id)).toEqual(['a', 'b', 'c'])
  })
})

// ─── sources store ───────────────────────────────────────────────────────────

describe('sourcesStore', () => {
  it('starts empty with no active source', () => {
    const store = useSourcesStore()
    expect(store.sources).toHaveLength(0)
    expect(store.activeSourceId).toBeNull()
    expect(store.activeSource).toBeNull()
  })

  it('setSources replaces the list and clears loaded images', () => {
    const store = useSourcesStore()
    store.setSources([makeSource()])
    expect(store.sources).toHaveLength(1)
    expect(store.loadedImages.size).toBe(0)
  })

  it('addSource appends', () => {
    const store = useSourcesStore()
    store.addSource(makeSource())
    expect(store.sources).toHaveLength(1)
  })

  it('updateSource patches by id', () => {
    const store = useSourcesStore()
    store.addSource(makeSource())
    store.updateSource('src-1', { label: 'Updated' })
    expect(store.sources[0]?.label).toBe('Updated')
  })

  it('removeSource removes and unsets activeSourceId', () => {
    const store = useSourcesStore()
    store.addSource(makeSource())
    store.setActiveSource('src-1')
    store.removeSource('src-1')
    expect(store.sources).toHaveLength(0)
    expect(store.activeSourceId).toBeNull()
  })

  it('removeSource keeps activeSourceId if a different source was active', () => {
    const store = useSourcesStore()
    store.addSource(makeSource({ id: 'src-1' }))
    store.addSource(makeSource({ id: 'src-2' }))
    store.setActiveSource('src-2')
    store.removeSource('src-1')
    expect(store.activeSourceId).toBe('src-2')
  })

  it('setActiveSource updates activeSource computed', () => {
    const store = useSourcesStore()
    store.addSource(makeSource())
    store.setActiveSource('src-1')
    expect(store.activeSource?.id).toBe('src-1')
  })

  it('markSourceLoading / markSourceLoaded toggles isActiveSourceLoading', () => {
    const store = useSourcesStore()
    store.addSource(makeSource())
    store.setActiveSource('src-1')
    store.markSourceLoading('src-1')
    expect(store.isActiveSourceLoading).toBe(true)
    store.markSourceLoaded('src-1')
    expect(store.isActiveSourceLoading).toBe(false)
  })

  it('orderedSources sorts by sortOrder', () => {
    const store = useSourcesStore()
    store.addSource(makeSource({ id: 'b', sortOrder: 2 }))
    store.addSource(makeSource({ id: 'a', sortOrder: 1 }))
    expect(store.orderedSources.map((s) => s.id)).toEqual(['a', 'b'])
  })

  it('markSourceFailed flags the source as failed for the active source', () => {
    const store = useSourcesStore()
    store.addSource(makeSource({ id: 'src-1' }))
    store.setActiveSource('src-1')
    expect(store.isActiveSourceFailed).toBe(false)
    store.markSourceFailed('src-1')
    expect(store.isActiveSourceFailed).toBe(true)
    expect(store.failedSourceIds.has('src-1')).toBe(true)
  })

  it('setLoadedImage clears a previously failed source', () => {
    const store = useSourcesStore()
    store.addSource(makeSource({ id: 'src-1' }))
    store.setActiveSource('src-1')
    store.markSourceFailed('src-1')
    store.setLoadedImage('src-1', {} as HTMLImageElement, 'data:image/png;base64,')
    expect(store.isActiveSourceFailed).toBe(false)
    expect(store.failedSourceIds.has('src-1')).toBe(false)
  })

  it('removeSource clears the failed flag for the removed source', () => {
    const store = useSourcesStore()
    store.addSource(makeSource({ id: 'src-1' }))
    store.markSourceFailed('src-1')
    store.removeSource('src-1')
    expect(store.failedSourceIds.has('src-1')).toBe(false)
  })

  it('setSources resets the failed set', () => {
    const store = useSourcesStore()
    store.addSource(makeSource({ id: 'src-1' }))
    store.markSourceFailed('src-1')
    store.setSources([makeSource({ id: 'src-2' })])
    expect(store.failedSourceIds.size).toBe(0)
  })
})
