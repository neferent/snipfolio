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

  it('returns true for guests under the 50-project cap', () => {
    const auth = useAuthStore()
    auth.isGuest = true
    const projects = useProjectStore()
    projects.setProjects([{ id: '1' } as Project])
    const { canCreateProject } = usePlan()
    expect(canCreateProject()).toBe(true)
  })

  it('returns false for guests at the 50-project cap', () => {
    const auth = useAuthStore()
    auth.isGuest = true
    const projects = useProjectStore()
    projects.setProjects(Array.from({ length: 50 }, (_, i) => ({ id: String(i) } as Project)))
    const { canCreateProject } = usePlan()
    expect(canCreateProject()).toBe(false)
  })

  it('returns true for pro users under the 50-project cap', () => {
    const auth = useAuthStore()
    auth.isPro = true
    const projects = useProjectStore()
    projects.setProjects([{ id: '1' } as Project, { id: '2' } as Project])
    const { canCreateProject } = usePlan()
    expect(canCreateProject()).toBe(true)
  })

  it('returns false for pro users at the 50-project cap', () => {
    const auth = useAuthStore()
    auth.isPro = true
    const projects = useProjectStore()
    projects.setProjects(Array.from({ length: 50 }, (_, i) => ({ id: String(i) } as Project)))
    const { canCreateProject } = usePlan()
    expect(canCreateProject()).toBe(false)
  })

  it('returns true for users with an active day pass under the 50-project cap', () => {
    const auth = useAuthStore()
    auth.isPro = false
    auth.proExpiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    const projects = useProjectStore()
    projects.setProjects([{ id: '1' } as Project, { id: '2' } as Project])
    const { canCreateProject } = usePlan()
    expect(canCreateProject()).toBe(true)
  })

  it('returns false for users with an active day pass at the 50-project cap', () => {
    const auth = useAuthStore()
    auth.isPro = false
    auth.proExpiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    const projects = useProjectStore()
    projects.setProjects(Array.from({ length: 50 }, (_, i) => ({ id: String(i) } as Project)))
    const { canCreateProject } = usePlan()
    expect(canCreateProject()).toBe(false)
  })

  it('returns true for free users under the 50-project cap', () => {
    const auth = useAuthStore()
    auth.isGuest = false
    auth.isPro = false
    const projects = useProjectStore()
    projects.setProjects([{ id: '1' } as Project])
    const { canCreateProject } = usePlan()
    expect(canCreateProject()).toBe(true)
  })

  it('returns false for free users at the 50-project cap', () => {
    const auth = useAuthStore()
    auth.isGuest = false
    auth.isPro = false
    const projects = useProjectStore()
    projects.setProjects(Array.from({ length: 50 }, (_, i) => ({ id: String(i) } as Project)))
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

describe('usePlan day pass', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('isDayPassActive is true when proExpiresAt is in the future', () => {
    const auth = useAuthStore()
    auth.proExpiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    const { isDayPassActive, isPro } = usePlan()
    expect(isDayPassActive.value).toBe(true)
    expect(isPro.value).toBe(true)
  })

  it('isDayPassActive is false when proExpiresAt is in the past', () => {
    const auth = useAuthStore()
    auth.proExpiresAt = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { isDayPassActive, isPro } = usePlan()
    expect(isDayPassActive.value).toBe(false)
    expect(isPro.value).toBe(false)
  })

  it('isDayPassActive is false for subscribers even with a stale proExpiresAt', () => {
    const auth = useAuthStore()
    auth.isPro = true
    auth.proExpiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    const { isDayPassActive, isPro } = usePlan()
    expect(isDayPassActive.value).toBe(false)
    expect(isPro.value).toBe(true)
  })

  it('dayPassExpiresAt returns the expiry date only while the day pass is active', () => {
    const auth = useAuthStore()
    const expiry = new Date(Date.now() + 60 * 60 * 1000)
    auth.proExpiresAt = expiry.toISOString()
    const { dayPassExpiresAt } = usePlan()
    expect(dayPassExpiresAt.value).toEqual(expiry)
  })
})
