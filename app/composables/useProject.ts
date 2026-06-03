import { useProjectStore } from '~/stores/project'
import { useSnipsStore } from '~/stores/snips'
import { useCompositionsStore } from '~/stores/compositions'
import { useAuthStore } from '~/stores/auth'
import type { Project, ProjectSnapshot, Snip, Composition } from '~/types'

function generateId() {
  return crypto.randomUUID()
}

export function useProject() {
  const projectStore = useProjectStore()
  const snipsStore = useSnipsStore()
  const compositionsStore = useCompositionsStore()
  const authStore = useAuthStore()
  const config = useRuntimeConfig()

  const isSupabase = config.public.authMode === 'supabase'

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
      const projects = loadLocalProjects()
      projectStore.setProjects(projects)
      return projects
    }
    const sb = useSupabaseClient()
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
    const sb = useSupabaseClient()
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
    const sb = useSupabaseClient()
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
      const snips = loadLocalData<Snip[]>(`snipfolio_snips_${id}`, [])
      const compositions = loadLocalData<Composition[]>(`snipfolio_comps_${id}`, [])
      snipsStore.setSnips(snips)
      compositionsStore.setCompositions(compositions)
      restoreImage(id)
      return project
    }
    const sb = useSupabaseClient()
    const [{ data: proj }, { data: snipsData }, { data: compsData }] = await Promise.all([
      sb.from('projects').select('*').eq('id', id).single(),
      sb.from('snips').select('*').eq('project_id', id).order('sort_order'),
      sb.from('compositions').select('*').eq('project_id', id).order('sort_order'),
    ])
    if (!proj) throw new Error('Project not found')
    projectStore.setProject(rowToProject(proj))
    snipsStore.setSnips((snipsData ?? []).map(rowToSnip))
    compositionsStore.setCompositions((compsData ?? []).map(rowToComposition))
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
      } else {
        const sb = useSupabaseClient()
        await Promise.all([
          sb
            .from('projects')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', project.id),
          sb.from('snips').upsert(snipsStore.snips.map(snipToRow)),
          sb.from('compositions').upsert(compositionsStore.compositions.map(compositionToRow)),
        ])
      }
      projectStore.setSaveStatus('saved')
    } catch {
      projectStore.setSaveStatus('error')
    }
  }

  function saveImage(projectId: string, src: string) {
    if (!import.meta.client) return
    try {
      localStorage.setItem(`snipfolio_img_${projectId}`, src)
    } catch {
      // Quota exceeded — image too large for localStorage; user will need to re-upload on refresh
    }
  }

  function restoreImage(projectId: string) {
    if (!import.meta.client) return
    const src = localStorage.getItem(`snipfolio_img_${projectId}`)
    if (!src) return
    const img = new Image()
    img.onload = () => projectStore.setSourceImage(img, src)
    img.src = src
  }

  return { fetchProjects, createProject, deleteProject, loadProject, scheduleSave, persistAll, saveImage }
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

function rowToSnip(row: Record<string, unknown>): Snip {
  return {
    id: row.id as string,
    projectId: (row.project_id ?? row.projectId) as string,
    label: row.label as string,
    x: row.x as number,
    y: row.y as number,
    width: row.width as number,
    height: row.height as number,
    deviceFrame: (row.device_frame ?? row.deviceFrame ?? 'none') as Snip['deviceFrame'],
    sortOrder: (row.sort_order ?? row.sortOrder ?? 0) as number,
  }
}

function snipToRow(snip: Snip) {
  return {
    id: snip.id,
    project_id: snip.projectId,
    label: snip.label,
    x: snip.x,
    y: snip.y,
    width: snip.width,
    height: snip.height,
    device_frame: snip.deviceFrame,
    sort_order: snip.sortOrder,
  }
}

function rowToComposition(row: Record<string, unknown>): Composition {
  return {
    id: row.id as string,
    projectId: (row.project_id ?? row.projectId) as string,
    name: row.name as string,
    type: (row.type ?? 'single') as Composition['type'],
    config: (row.config ?? {}) as Composition['config'],
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
