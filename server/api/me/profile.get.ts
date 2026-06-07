export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, 'authorization') ?? ''
  const token = authHeader.replace(/^Bearer\s+/i, '')
  if (!token) throw createError({ statusCode: 401, message: 'Missing token' })

  // Verify the token and get user id
  const config = useRuntimeConfig()
  const { createClient } = await import('@supabase/supabase-js')
  const anonClient = createClient(config.public.supabaseUrl, config.public.supabaseKey)
  const { data: { user }, error } = await anonClient.auth.getUser(token)
  if (error || !user) throw createError({ statusCode: 401, message: 'Invalid token' })

  // Read profile with service role to bypass RLS
  const sb = useSupabaseAdmin()
  const { data: profile } = await sb
    .from('profiles')
    .select('is_pro, is_admin')
    .eq('id', user.id)
    .single()

  return {
    isPro: profile?.is_pro ?? false,
    isAdmin: profile?.is_admin ?? false,
  }
})
