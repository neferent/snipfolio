const STORAGE_KEY = 'snipfolio_post_auth_redirect'

export interface PostAuthRedirect {
  path: string
  /** Set when the user was sent to sign in/up mid-checkout, so we can resume checkout instead of just navigating back. */
  checkoutType?: 'pro' | 'day_pass'
}

/** Remembers where to send the user after they sign in/up, e.g. so they can resume an action that required an account. */
export function setPostAuthRedirect(path: string, checkoutType?: 'pro' | 'day_pass') {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ path, checkoutType }))
}

/** Reads and clears the remembered post-auth destination, defaulting to /dashboard. */
export function consumePostAuthRedirect(): PostAuthRedirect {
  const raw = localStorage.getItem(STORAGE_KEY)
  localStorage.removeItem(STORAGE_KEY)
  if (!raw) return { path: '/dashboard' }
  try {
    const parsed = JSON.parse(raw) as PostAuthRedirect
    return { path: parsed.path || '/dashboard', checkoutType: parsed.checkoutType }
  } catch {
    // Back-compat with the old plain-path format.
    return { path: raw }
  }
}
