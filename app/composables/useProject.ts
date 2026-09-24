import { useProjectStore } from '~/stores/project'
import { useSnipsStore } from '~/stores/snips'
import { useCompositionsStore } from '~/stores/compositions'
import { useSourcesStore } from '~/stores/sources'
import { useAuthStore } from '~/stores/auth'
import { saveImageToDb, getImageFromDb, deleteImageFromDb, generateThumbnail } from '~/utils/imageDb'
import type { Project, SourceImage, Snip, Composition } from '~/types'

function generateId() {
  return crypto.randomUUID()
}

let beforeUnloadRegistered = false

// Snipfolio-local is a purely local, single-user desktop app — everything
// lives in localStorage (project/snip/composition metadata) and IndexedDB
// (image bytes, via ~/utils/imageDb). There is no server/account involved.
export function useProject() {
  const projectStore = useProjectStore()
  const snipsStore = useSnipsStore()
  const compositionsStore = useCompositionsStore()
  const sourcesStore = useSourcesStore()
  const authStore = useAuthStore()

  const LOCAL_KEY = 'snipfolio_projects'

  function loadLocalProjects(): Project[] {
    if (!import.meta.client) return []
    try {
      return JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '[]')
    } catch {
      return []
    }
  }

  function saveLocalProjects(projects: Project[]) {
    if (!import.meta.client) return
    localStorage.setItem(LOCAL_KEY, JSON.stringify(projects))
  }

  // --- Project CRUD ---
  async function fetchProjects(): Promise<Project[]> {
    const projects = loadLocalProjects().filter((p) => p.userId === authStore.user!.id)
    projectStore.setProjects(projects)
    return projects
  }

  async function createProject(name: string): Promise<Project> {
    const now = new Date().toISOString()
    const project: Project = {
      id: generateId(),
      userId: authStore.user!.id,
      name,
      createdAt: now,
      updatedAt: now,
    }
    const projects = loadLocalProjects()
    projects.unshift(project)
    saveLocalProjects(projects)
    projectStore.setProjects(projects)
    return project
  }

  async function renameProject(id: string, name: string) {
    const trimmed = name.trim() || 'Untitled project'
    const projects = loadLocalProjects()
    const existing = projects.find((p) => p.id === id)
    if (existing) {
      existing.name = trimmed
      existing.updatedAt = new Date().toISOString()
      saveLocalProjects(projects)
    }
    projectStore.setProjects(projectStore.projects.map((p) => (p.id === id ? { ...p, name: trimmed } : p)))
    if (projectStore.current?.id === id) {
      projectStore.current.name = trimmed
    }
  }

  async function deleteProject(id: string) {
    const projects = loadLocalProjects().filter((p) => p.id !== id)
    saveLocalProjects(projects)
    projectStore.setProjects(projects)
  }

  async function loadProject(id: string) {
    const projects = loadLocalProjects()
    const project = projects.find((p) => p.id === id)
    if (!project) throw new Error('Project not found')
    projectStore.setProject(project)

    let snips = loadLocalData<Snip[]>(`snipfolio_snips_${id}`, [])
    const compositions = loadLocalData<Composition[]>(`snipfolio_comps_${id}`, [])
    let sources = loadLocalData<SourceImage[]>(`snipfolio_sources_${id}`, [])

    // Migration: if no sources but old single-image snips exist, synthesize a default source
    if (sources.length === 0) {
      const oldSrc = import.meta.client ? localStorage.getItem(`snipfolio_img_${id}`) : null
      if (oldSrc) {
        const defaultSource: SourceImage = {
          id: 'default',
          projectId: id,
          label: 'Screenshot',
          filename: 'screenshot',
          width: 0,
          height: 0,
          sortOrder: 0,
        }
        sources = [defaultSource]
        snips = snips.map((s) => ({ ...s, sourceImageId: s.sourceImageId ?? 'default' }))
      }
    }

    sourcesStore.setSources(sources)
    sources.forEach((s) => sourcesStore.markSourceLoading(s.id))
    sourcesStore.setActiveSource(sources[0]?.id ?? null)
    snipsStore.setSnips(snips)
    compositionsStore.setCompositions(compositions)
    await restoreImages(id, sources)
    return project
  }

  // --- Save / auto-save ---
  let saveTimer: ReturnType<typeof setTimeout> | null = null

  function scheduleSave() {
    projectStore.markUnsaved()
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => persistAll(), 1500)
  }

  async function persistAll() {
    const project = projectStore.current
    if (!project) return
    projectStore.setSaveStatus('saving')
    try {
      const projects = loadLocalProjects()
      const idx = projects.findIndex((p) => p.id === project.id)
      const updated = { ...project, updatedAt: new Date().toISOString() }
      if (idx !== -1) projects[idx] = updated
      else projects.unshift(updated)
      saveLocalProjects(projects)
      saveLocalData(`snipfolio_snips_${project.id}`, snipsStore.snips)
      saveLocalData(`snipfolio_comps_${project.id}`, compositionsStore.compositions)
      saveLocalData(`snipfolio_sources_${project.id}`, sourcesStore.sources)
      projectStore.setSaveStatus('saved')
    } catch {
      // Local persistence (localStorage/IndexedDB) failing is unusual — most
      // likely full storage. Surface it rather than silently retrying forever.
      projectStore.setSaveStatus('error')
    }
  }

  // Flush a pending debounced save immediately, and warn the user if leaving
  // the page would lose changes that haven't been confirmed saved yet.
  if (import.meta.client && !beforeUnloadRegistered) {
    beforeUnloadRegistered = true
    window.addEventListener('beforeunload', (e) => {
      if (saveTimer) {
        clearTimeout(saveTimer)
        saveTimer = null
        persistAll()
      }
      const status = projectStore.saveStatus
      if (status === 'unsaved' || status === 'saving' || status === 'error') {
        e.preventDefault()
        e.returnValue = ''
      }
    })
  }

  async function savePreview(projectId: string, img: HTMLImageElement) {
    if (!import.meta.client) return
    try {
      const thumb = await generateThumbnail(img)
      saveImageToDb(`preview_${projectId}`, thumb).catch(() => {})
    } catch {
      // Canvas error — preview won't show on dashboard
    }
  }

  async function loadPreview(projectId: string): Promise<string | null> {
    if (!import.meta.client) return null
    return getImageFromDb(`preview_${projectId}`).catch(() => null)
  }

  async function saveImage(projectId: string, sourceId: string, src: string) {
    if (!import.meta.client) return
    await saveImageToDb(`${projectId}_${sourceId}`, src)
  }

  function deleteImage(projectId: string, sourceId: string) {
    if (!import.meta.client) return
    deleteImageFromDb(`${projectId}_${sourceId}`).catch(() => {})
  }

  function deleteSourceRecord(projectId: string, sourceId: string) {
    if (!import.meta.client) return
    const sources = loadLocalData<SourceImage[]>(`snipfolio_sources_${projectId}`, [])
    saveLocalData(`snipfolio_sources_${projectId}`, sources.filter((s) => s.id !== sourceId))
  }

  function deleteCompositionRecord(projectId: string, compositionId: string) {
    if (!import.meta.client) return
    const comps = loadLocalData<Composition[]>(`snipfolio_comps_${projectId}`, [])
    saveLocalData(`snipfolio_comps_${projectId}`, comps.filter((c) => c.id !== compositionId))
  }

  async function restoreImages(projectId: string, sources: SourceImage[]) {
    if (!import.meta.client) return
    for (const source of sources) {
      const key = `${projectId}_${source.id}`
      // Try IndexedDB first, fall back to legacy localStorage for migration
      let src = await getImageFromDb(key).catch(() => null)
      if (!src) {
        src =
          localStorage.getItem(`snipfolio_img_${projectId}_${source.id}`) ??
          (source.id === 'default' ? localStorage.getItem(`snipfolio_img_${projectId}`) : null)
        if (src) {
          // Migrate to IndexedDB and clear from localStorage
          saveImageToDb(key, src).catch(() => {})
          localStorage.removeItem(`snipfolio_img_${projectId}_${source.id}`)
        }
      }
      sourcesStore.markSourceLoaded(source.id)
      if (!src) {
        sourcesStore.markSourceFailed(source.id)
        continue
      }
      const img = new Image()
      img.onload = () => {
        sourcesStore.setLoadedImage(source.id, img, src!)
        if (source.width === 0 || source.height === 0) {
          sourcesStore.updateSource(source.id, { width: img.naturalWidth, height: img.naturalHeight })
        }
        if (source.id === sources[0]?.id) backfillPreview(projectId, img)
      }
      img.onerror = () => {
        sourcesStore.markSourceFailed(source.id)
      }
      img.src = src
    }
  }

  // Generates a dashboard preview for older projects that were created before
  // preview generation existed (or via a flow that skipped it).
  async function backfillPreview(projectId: string, img: HTMLImageElement) {
    const existing = await loadPreview(projectId)
    if (!existing) await savePreview(projectId, img)
  }

  return { fetchProjects, createProject, renameProject, deleteProject, loadProject, scheduleSave, persistAll, saveImage, deleteImage, deleteSourceRecord, deleteCompositionRecord, savePreview, loadPreview }
}

function loadLocalData<T>(key: string, fallback: T): T {
  if (!import.meta.client) return fallback
  try {
    return JSON.parse(localStorage.getItem(key) ?? JSON.stringify(fallback))
  } catch {
    return fallback
  }
}

function saveLocalData(key: string, data: unknown) {
  if (!import.meta.client) return
  localStorage.setItem(key, JSON.stringify(data))
}
