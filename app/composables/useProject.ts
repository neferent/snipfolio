import { useProjectStore } from '~/stores/project'
import { useSnipsStore } from '~/stores/snips'
import { useCompositionsStore } from '~/stores/compositions'
import { useSourcesStore } from '~/stores/sources'
import { useAuthStore } from '~/stores/auth'
import { saveImageToDb, getImageFromDb, deleteImageFromDb, generateThumbnail } from '~/utils/imageDb'
import type { Project, SourceImage, Snip, Composition, FreeformCompositionConfig, BackgroundConfig, DeviceFrame } from '~/types'

function generateId() {
  return crypto.randomUUID()
}

export function useProject() {
  const projectStore = useProjectStore()
  const snipsStore = useSnipsStore()
  const compositionsStore = useCompositionsStore()
  const sourcesStore = useSourcesStore()
  const authStore = useAuthStore()
  const config = useRuntimeConfig()

  const isSupabase = config.public.authMode === 'supabase' && !authStore.isGuest

  // --- Local in-memory persistence (dev mode) ---
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
    if (!isSupabase) {
      const projects = loadLocalProjects().filter((p) => p.userId === authStore.user!.id)
      projectStore.setProjects(projects)
      return projects
    }
    const sb = useSupabaseClient()!!
    const { data, error } = await sb
      .from('projects')
      .select('*')
      .eq('user_id', authStore.user!.id)
      .order('updated_at', { ascending: false })
    if (error) throw error
    const projects: Project[] = (data ?? []).map(rowToProject)
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
    if (!isSupabase) {
      const projects = loadLocalProjects()
      projects.unshift(project)
      saveLocalProjects(projects)
      projectStore.setProjects(projects)
      return project
    }
    const sb = useSupabaseClient()!
    const { data, error } = await sb
      .from('projects')
      .insert({ id: project.id, user_id: project.userId, name, created_at: now, updated_at: now })
      .select()
      .single()
    if (error) throw error
    return rowToProject(data)
  }

  async function deleteProject(id: string) {
    if (!isSupabase) {
      const projects = loadLocalProjects().filter((p) => p.id !== id)
      saveLocalProjects(projects)
      projectStore.setProjects(projects)
      return
    }
    const sb = useSupabaseClient()!
    const { error } = await sb.from('projects').delete().eq('id', id)
    if (error) throw error
    projectStore.setProjects(projectStore.projects.filter((p) => p.id !== id))
  }

  async function loadProject(id: string) {
    if (!isSupabase) {
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
    const sb = useSupabaseClient()!
    const [{ data: proj }, { data: snipsData }, { data: compsData }, { data: sourcesData }] =
      await Promise.all([
        sb.from('projects').select('*').eq('id', id).single(),
        sb.from('snips').select('*').eq('project_id', id).order('sort_order'),
        sb.from('compositions').select('*').eq('project_id', id).order('sort_order'),
        sb.from('source_images').select('*').eq('project_id', id).order('sort_order'),
      ])
    if (!proj) throw new Error('Project not found')
    projectStore.setProject(rowToProject(proj))

    const sources = (sourcesData ?? []).map(rowToSourceImage)
    sourcesStore.setSources(sources)
    sources.forEach((s) => sourcesStore.markSourceLoading(s.id))
    sourcesStore.setActiveSource(sources[0]?.id ?? null)
    snipsStore.setSnips((snipsData ?? []).map(rowToSnip))
    compositionsStore.setCompositions((compsData ?? []).map(rowToComposition))
    await restoreImages(id, sources)
    return proj
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
      if (!isSupabase) {
        const projects = loadLocalProjects()
        const idx = projects.findIndex((p) => p.id === project.id)
        const updated = { ...project, updatedAt: new Date().toISOString() }
        if (idx !== -1) projects[idx] = updated
        else projects.unshift(updated)
        saveLocalProjects(projects)
        saveLocalData(`snipfolio_snips_${project.id}`, snipsStore.snips)
        saveLocalData(`snipfolio_comps_${project.id}`, compositionsStore.compositions)
        saveLocalData(`snipfolio_sources_${project.id}`, sourcesStore.sources)
      } else {
        const sb = useSupabaseClient()!
        await Promise.all([
          sb
            .from('projects')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', project.id),
          sb.from('snips').upsert(snipsStore.snips.map(snipToRow)),
          sb.from('compositions').upsert(compositionsStore.compositions.map(compositionToRow)),
          sb.from('source_images').upsert(sourcesStore.sources.map(sourceImageToRow)),
        ])
      }
      projectStore.setSaveStatus('saved')
    } catch {
      projectStore.setSaveStatus('error')
    }
  }

  // --- Supabase Storage helpers ---
  async function uploadImageToStorage(projectId: string, sourceId: string, src: string): Promise<void> {
    const userId = authStore.user!.id
    const sb = useSupabaseClient()!
    const blob = await fetch(src).then((r) => r.blob())
    const path = `${userId}/${projectId}/${sourceId}`
    const { error } = await sb.storage.from('screenshots').upload(path, blob, {
      contentType: blob.type || 'image/png',
      upsert: true,
    })
    if (error) throw error
  }

  async function downloadImageFromStorage(projectId: string, sourceId: string): Promise<string | null> {
    const userId = authStore.user!.id
    const sb = useSupabaseClient()!
    const path = `${userId}/${projectId}/${sourceId}`
    const { data, error } = await sb.storage.from('screenshots').download(path)
    if (error || !data) return null
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.readAsDataURL(data)
    })
  }

  async function deleteImageFromStorage(projectId: string, sourceId: string): Promise<void> {
    const userId = authStore.user!.id
    const sb = useSupabaseClient()!
    const path = `${userId}/${projectId}/${sourceId}`
    await sb.storage.from('screenshots').remove([path])
  }

  function savePreview(projectId: string, img: HTMLImageElement) {
    if (!import.meta.client) return
    try {
      const thumb = generateThumbnail(img)
      if (isSupabase) {
        uploadImageToStorage(projectId, `__preview__`, thumb).catch(() => {})
      } else {
        saveImageToDb(`preview_${projectId}`, thumb).catch(() => {})
      }
    } catch {
      // Canvas error — preview won't show on dashboard
    }
  }

  async function loadPreview(projectId: string): Promise<string | null> {
    if (!import.meta.client) return null
    if (isSupabase) {
      const cached = await getImageFromDb(`preview_${projectId}`).catch(() => null)
      if (cached) return cached
      const remote = await downloadImageFromStorage(projectId, `__preview__`).catch(() => null)
      if (remote) saveImageToDb(`preview_${projectId}`, remote).catch(() => {})
      return remote
    }
    return getImageFromDb(`preview_${projectId}`).catch(() => null)
  }

  function saveImage(projectId: string, sourceId: string, src: string) {
    if (!import.meta.client) return
    if (isSupabase) {
      uploadImageToStorage(projectId, sourceId, src).catch(() => {})
    } else {
      const key = `${projectId}_${sourceId}`
      saveImageToDb(key, src).catch(() => {})
    }
  }

  function deleteImage(projectId: string, sourceId: string) {
    if (!import.meta.client) return
    if (isSupabase) {
      deleteImageFromStorage(projectId, sourceId).catch(() => {})
    } else {
      deleteImageFromDb(`${projectId}_${sourceId}`).catch(() => {})
    }
  }

  function deleteSourceRecord(projectId: string, sourceId: string) {
    if (!import.meta.client) return
    if (isSupabase) {
      const sb = useSupabaseClient()!
      sb.from('source_images').delete().eq('id', sourceId).eq('project_id', projectId).then(() => {})
    } else {
      const sources = loadLocalData<SourceImage[]>(`snipfolio_sources_${projectId}`, [])
      saveLocalData(`snipfolio_sources_${projectId}`, sources.filter((s) => s.id !== sourceId))
    }
  }

  async function restoreImages(projectId: string, sources: SourceImage[]) {
    if (!import.meta.client) return
    if (isSupabase) {
      for (const source of sources) {
        const key = `${projectId}_${source.id}`
        let src = await getImageFromDb(key).catch(() => null)
        if (!src) {
          src = await downloadImageFromStorage(projectId, source.id).catch(() => null)
          if (src) saveImageToDb(key, src).catch(() => {})
        }
        sourcesStore.markSourceLoaded(source.id)
        if (!src) continue
        const img = new Image()
        img.onload = () => {
          sourcesStore.setLoadedImage(source.id, img, src!)
          if (source.width === 0 || source.height === 0) {
            sourcesStore.updateSource(source.id, { width: img.naturalWidth, height: img.naturalHeight })
          }
        }
        img.src = src
      }
      return
    }
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
      if (!src) continue
      const img = new Image()
      img.onload = () => {
        sourcesStore.setLoadedImage(source.id, img, src!)
        if (source.width === 0 || source.height === 0) {
          sourcesStore.updateSource(source.id, { width: img.naturalWidth, height: img.naturalHeight })
        }
      }
      img.src = src
    }
  }

  return { fetchProjects, createProject, deleteProject, loadProject, scheduleSave, persistAll, saveImage, deleteImage, deleteSourceRecord, savePreview, loadPreview }
}

// --- Row mappers ---
function rowToProject(row: Record<string, unknown>): Project {
  return {
    id: row.id as string,
    userId: (row.user_id ?? row.userId) as string,
    name: row.name as string,
    createdAt: (row.created_at ?? row.createdAt) as string,
    updatedAt: (row.updated_at ?? row.updatedAt) as string,
  }
}

function rowToSourceImage(row: Record<string, unknown>): SourceImage {
  return {
    id: row.id as string,
    projectId: (row.project_id ?? row.projectId) as string,
    label: row.label as string,
    filename: row.filename as string,
    width: (row.width ?? 0) as number,
    height: (row.height ?? 0) as number,
    sortOrder: (row.sort_order ?? row.sortOrder ?? 0) as number,
  }
}

function sourceImageToRow(s: SourceImage) {
  return {
    id: s.id,
    project_id: s.projectId,
    label: s.label,
    filename: s.filename,
    width: s.width,
    height: s.height,
    sort_order: s.sortOrder,
  }
}

function rowToSnip(row: Record<string, unknown>): Snip {
  return {
    id: row.id as string,
    projectId: (row.project_id ?? row.projectId) as string,
    sourceImageId: (row.source_image_id ?? row.sourceImageId ?? 'default') as string,
    label: row.label as string,
    x: row.x as number,
    y: row.y as number,
    width: row.width as number,
    height: row.height as number,
    sortOrder: (row.sort_order ?? row.sortOrder ?? 0) as number,
    snapFrame: (row.snap_frame ?? row.snapFrame ?? null) as 'laptop' | 'phone' | 'tablet' | null,
  }
}

function snipToRow(snip: Snip) {
  return {
    id: snip.id,
    project_id: snip.projectId,
    source_image_id: snip.sourceImageId,
    label: snip.label,
    x: snip.x,
    y: snip.y,
    width: snip.width,
    height: snip.height,
    sort_order: snip.sortOrder,
    snap_frame: snip.snapFrame ?? null,
  }
}

function rowToComposition(row: Record<string, unknown>): Composition {
  const rawType = (row.type ?? 'single') as string
  const rawConfig = (row.config ?? {}) as Record<string, unknown>

  // Migrate legacy 'single' compositions → 'laptop' freeform
  if (rawType === 'single') {
    const oW = (rawConfig.outputWidth as number) ?? 1920
    const oH = (rawConfig.outputHeight as number) ?? 1080
    const slotW = Math.round(oW * 0.65)
    const slotH = Math.round(oH * 0.65)
    const config: FreeformCompositionConfig = {
      slots: [
        {
          id: crypto.randomUUID(),
          snipId: (rawConfig.snipId as string) ?? '',
          deviceFrame: (rawConfig.deviceFrame as DeviceFrame) ?? 'none',
          x: Math.round((oW - slotW) / 2),
          y: Math.round((oH - slotH) / 2),
          width: slotW,
          height: slotH,
        },
      ],
      background: (rawConfig.background as BackgroundConfig) ?? {
        type: 'solid', color: '#1a1a2e', gradientStart: '#1a1a2e', gradientEnd: '#16213e', gradientAngle: 135,
      },
      outputWidth: oW,
      outputHeight: oH,
    }
    return {
      id: row.id as string,
      projectId: (row.project_id ?? row.projectId) as string,
      name: row.name as string,
      type: 'laptop',
      config,
      sortOrder: (row.sort_order ?? row.sortOrder ?? 0) as number,
    }
  }

  // Migrate legacy 'collage' type → 'auto'
  const type = rawType === 'collage' ? 'auto' : rawType as Composition['type']

  return {
    id: row.id as string,
    projectId: (row.project_id ?? row.projectId) as string,
    name: row.name as string,
    type,
    config: rawConfig as unknown as Composition['config'],
    sortOrder: (row.sort_order ?? row.sortOrder ?? 0) as number,
  }
}

function compositionToRow(comp: Composition) {
  return {
    id: comp.id,
    project_id: comp.projectId,
    name: comp.name,
    type: comp.type,
    config: comp.config,
    sort_order: comp.sortOrder,
  }
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
