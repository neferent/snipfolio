import { createClient } from '@supabase/supabase-js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = ReturnType<typeof createClient<any>>

let _client: AnyClient | null = null

export function useSupabaseClient(): AnyClient | null {
  if (!_client) {
    const config = useRuntimeConfig()
    if (!config.public.supabaseUrl) return null
    _client = createClient(config.public.supabaseUrl, config.public.supabaseKey)
  }
  return _client
}
