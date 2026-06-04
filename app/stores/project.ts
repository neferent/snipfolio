import { defineStore } from 'pinia'
import type { Project } from '~/types'

export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error'

export const useProjectStore = defineStore('project', () => {
  const current = ref<Project | null>(null)
  const saveStatus = ref<SaveStatus>('saved')
  const projects = ref<Project[]>([])

  function setProject(p: Project | null) {
    current.value = p
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
    saveStatus,
    projects,
    setProject,
    setSaveStatus,
    setProjects,
    markUnsaved,
  }
})
