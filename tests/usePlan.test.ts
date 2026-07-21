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

  it('returns true for guests under the 3-project cap', () => {
    const auth = useAuthStore()
    auth.isGuest = true
    const projects = useProjectStore()
    projects.setProjects([{ id: '1' } as Project])
    const { canCreateProject } = usePlan()
    expect(canCreateProject()).toBe(true)
  })

  it('returns false for guests at the 3-project cap', () => {
    const auth = useAuthStore()
    auth.isGuest = true
    const projects = useProjectStore()
    projects.setProjects(Array.from({ length: 3 }, (_, i) => ({ id: String(i) } as Project)))
    const { canCreateProject } = usePlan()
    expect(canCreateProject()).toBe(false)
  })

  it('returns true for pro users past the 3-project cap (unlimited)', () => {
    const auth = useAuthStore()
    auth.isPro = true
    const projects = useProjectStore()
    projects.setProjects(Array.from({ length: 50 }, (_, i) => ({ id: String(i) } as Project)))
    const { canCreateProject } = usePlan()
    expect(canCreateProject()).toBe(true)
  })

  it('returns true for users with an active day pass past the 3-project cap (unlimited)', () => {
    const auth = useAuthStore()
    auth.isPro = false
    auth.proExpiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    const projects = useProjectStore()
    projects.setProjects(Array.from({ length: 50 }, (_, i) => ({ id: String(i) } as Project)))
    const { canCreateProject } = usePlan()
    expect(canCreateProject()).toBe(true)
  })

  it('returns true for free users under the 3-project cap', () => {
    const auth = useAuthStore()
    auth.isGuest = false
    auth.isPro = false
    const projects = useProjectStore()
    projects.setProjects([{ id: '1' } as Project])
    const { canCreateProject } = usePlan()
    expect(canCreateProject()).toBe(true)
  })

  it('returns false for free users at the 3-project cap', () => {
    const auth = useAuthStore()
    auth.isGuest = false
    auth.isPro = false
    const projects = useProjectStore()
    projects.setProjects(Array.from({ length: 3 }, (_, i) => ({ id: String(i) } as Project)))
    const { canCreateProject } = usePlan()
    expect(canCreateProject()).toBe(false)
  })
})

describe('usePlan.isProjectLocked', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  function projectAt(id: string, daysAgo: number): Project {
    return { id, createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString() } as Project
  }

  it('locks nothing for pro users regardless of project count', () => {
    const auth = useAuthStore()
    auth.isPro = true
    const projects = useProjectStore()
    projects.setProjects(Array.from({ length: 5 }, (_, i) => projectAt(String(i), i)))
    const { isProjectLocked } = usePlan()
    expect(projects.projects.every((p) => !isProjectLocked(p.id))).toBe(true)
  })

  it('locks nothing for free users at or under the cap', () => {
    const projects = useProjectStore()
    projects.setProjects([projectAt('1', 2), projectAt('2', 1), projectAt('3', 0)])
    const { isProjectLocked } = usePlan()
    expect(isProjectLocked('1')).toBe(false)
    expect(isProjectLocked('2')).toBe(false)
    expect(isProjectLocked('3')).toBe(false)
  })

  it('locks everything past the oldest 3 for free users over the cap', () => {
    const projects = useProjectStore()
    // Created 4 days ago through today — '4' is oldest, '0' is newest.
    projects.setProjects([
      projectAt('4', 4), projectAt('3', 3), projectAt('2', 2), projectAt('1', 1), projectAt('0', 0),
    ])
    const { isProjectLocked } = usePlan()
    expect(isProjectLocked('4')).toBe(false)
    expect(isProjectLocked('3')).toBe(false)
    expect(isProjectLocked('2')).toBe(false)
    expect(isProjectLocked('1')).toBe(true)
    expect(isProjectLocked('0')).toBe(true)
  })

  it('unlocks previously-locked projects once the count drops back to the cap', () => {
    const projects = useProjectStore()
    projects.setProjects([projectAt('4', 4), projectAt('3', 3), projectAt('2', 2)])
    const { isProjectLocked } = usePlan()
    expect(projects.projects.every((p) => !isProjectLocked(p.id))).toBe(true)
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
