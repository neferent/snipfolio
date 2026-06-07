import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '~/stores/auth'
import { useProjectStore } from '~/stores/project'
import { usePlan } from '~/composables/usePlan'
import type { Project } from '~/types'

describe('usePlan.canCreateProject', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('returns false for guests', () => {
    const auth = useAuthStore()
    auth.isGuest = true
    const { canCreateProject } = usePlan()
    expect(canCreateProject()).toBe(false)
  })

  it('returns true for pro users regardless of project count', () => {
    const auth = useAuthStore()
    auth.isPro = true
    const projects = useProjectStore()
    projects.setProjects([{ id: '1' } as Project, { id: '2' } as Project])
    const { canCreateProject } = usePlan()
    expect(canCreateProject()).toBe(true)
  })

  it('returns true for free users with no projects', () => {
    const auth = useAuthStore()
    auth.isGuest = false
    auth.isPro = false
    const { canCreateProject } = usePlan()
    expect(canCreateProject()).toBe(true)
  })

  it('returns false for free users who already have a project', () => {
    const auth = useAuthStore()
    auth.isGuest = false
    auth.isPro = false
    const projects = useProjectStore()
    projects.setProjects([{ id: '1' } as Project])
    const { canCreateProject } = usePlan()
    expect(canCreateProject()).toBe(false)
  })
})

describe('usePlan computed flags', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('isPro reflects auth store', () => {
    const auth = useAuthStore()
    auth.isPro = true
    const { isPro } = usePlan()
    expect(isPro.value).toBe(true)
  })

  it('isGuest reflects auth store', () => {
    const auth = useAuthStore()
    auth.isGuest = true
    const { isGuest } = usePlan()
    expect(isGuest.value).toBe(true)
  })
})
