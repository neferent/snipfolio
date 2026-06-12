// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any

let _client: AnyClient | null = null
let _initPromise: Promise<void> | null = null

// Called by auth.client.ts before any page code runs, and lazily by useAuth.ts
// for routes the plugin skipped initializing on (e.g. SPA nav from "/" to "/login").
// Dynamic import keeps @supabase/supabase-js out of the entry chunk. Idempotent.
export async function initSupabaseClient(): Promise<void> {
  if (_client) return
  if (!_initPromise) {
    _initPromise = (async () => {
      const config = useRuntimeConfig()
      if (!config.public.supabaseUrl) return
      const { createClient } = await import('@supabase/supabase-js')
      _client = createClient(config.public.supabaseUrl, config.public.supabaseKey)
    })()
  }
  await _initPromise
}

export function useSupabaseClient(): AnyClient | null {
  return _client
}
