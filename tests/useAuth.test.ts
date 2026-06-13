import { describe, it, expect } from 'vitest'
import { getAuthErrorMessage } from '~/composables/useAuth'

describe('getAuthErrorMessage', () => {
  it('returns a network-specific message for AuthRetryableFetchError', () => {
    const err = new Error('fetch failed')
    err.name = 'AuthRetryableFetchError'
    expect(getAuthErrorMessage(err, 'fallback')).toMatch(/network/i)
  })

  it('returns a network-specific message for generic fetch failures', () => {
    const err = new TypeError('Failed to fetch')
    expect(getAuthErrorMessage(err, 'fallback')).toMatch(/network/i)
  })

  it('passes through other Error messages unchanged', () => {
    const err = new Error('Invalid login credentials')
    expect(getAuthErrorMessage(err, 'fallback')).toBe('Invalid login credentials')
  })

  it('returns the fallback for non-Error values', () => {
    expect(getAuthErrorMessage('oops', 'fallback')).toBe('fallback')
    expect(getAuthErrorMessage(undefined, 'fallback')).toBe('fallback')
  })
})
