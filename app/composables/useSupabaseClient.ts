// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any

let _client: AnyClient | null = null

// Called once by auth.client.ts before any page code runs.
// Dynamic import keeps @supabase/supabase-js out of the entry chunk.
export async function initSupabaseClient(): Promise<void> {
  const config = useRuntimeConfig()
  if (!config.public.supabaseUrl) return
  const { createClient } = await import('@supabase/supabase-js')
  _client = createClient(config.public.supabaseUrl, config.public.supabaseKey)
}

export function useSupabaseClient(): AnyClient | null {
  return _client
}
