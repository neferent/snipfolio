import { defineStore } from 'pinia'
import type { Project, ProjectSnapshot } from '~/types'

export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error'

export const useProjectStore = defineStore('project', () => {
  const current = ref<Project | null>(null)
  const snapshot = ref<ProjectSnapshot | null>(null)
  const sourceImage = ref<HTMLImageElement | null>(null)
  const sourceImageSrc = ref<string | null>(null)
  const saveStatus = ref<SaveStatus>('saved')
  const projects = ref<Project[]>([])

  function setProject(p: Project | null) {
    current.value = p
  }

  function setSnapshot(s: ProjectSnapshot | null) {
    snapshot.value = s
  }

  function setSourceImage(img: HTMLImageElement | null, src?: string) {
    sourceImage.value = img
    if (src !== undefined) sourceImageSrc.value = src
  }

  function setSaveStatus(s: SaveStatus) {
    saveStatus.value = s
  }

  function setProjects(list: Project[]) {
    projects.value = list
  }

  function markUnsaved() {
    saveStatus.value = 'unsaved'
  }

  return {
    current,
    snapshot,
    sourceImage,
    sourceImageSrc,
    saveStatus,
    projects,
    setProject,
    setSnapshot,
    setSourceImage,
    setSaveStatus,
    setProjects,
    markUnsaved,
  }
})
