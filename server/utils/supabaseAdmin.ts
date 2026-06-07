import { createClient } from '@supabase/supabase-js'

export function useSupabaseAdmin() {
  const config = useRuntimeConfig()
  return createClient(
    config.public.supabaseUrl,
    config.supabaseServiceKey,
    { auth: { persistSession: false } },
  )
}

// Verify the caller's JWT and return their user_id, or throw 401/403
export async function requireAdmin(event: Parameters<typeof getHeader>[0]): Promise<string> {
  const config = useRuntimeConfig()
  const authHeader = getHeader(event, 'authorization') ?? ''
  const token = authHeader.replace(/^Bearer\s+/i, '')
  if (!token) throw createError({ statusCode: 401, message: 'Missing token' })

  const sb = createClient(config.public.supabaseUrl, config.public.supabaseKey)
  const { data: { user }, error } = await sb.auth.getUser(token)
  if (error || !user) throw createError({ statusCode: 401, message: 'Invalid token' })

  const admin = useSupabaseAdmin()
  const { data: profile } = await admin
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) throw createError({ statusCode: 403, message: 'Not an admin' })
  return user.id
}
