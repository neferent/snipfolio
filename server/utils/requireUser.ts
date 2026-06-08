import { createClient } from '@supabase/supabase-js'

export async function requireUser(event: Parameters<typeof getHeader>[0]): Promise<string> {
  const config = useRuntimeConfig()
  const authHeader = getHeader(event, 'authorization') ?? ''
  const token = authHeader.replace(/^Bearer\s+/i, '')
  if (!token) throw createError({ statusCode: 401, message: 'Missing token' })

  const sb = createClient(config.public.supabaseUrl, config.public.supabaseKey)
  const { data: { user }, error } = await sb.auth.getUser(token)
  if (error || !user) throw createError({ statusCode: 401, message: 'Invalid token' })

  return user.id
}
