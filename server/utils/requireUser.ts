export async function requireUser(event: Parameters<typeof getHeader>[0]): Promise<string> {
  const authHeader = getHeader(event, 'authorization') ?? ''
  const token = authHeader.replace(/^Bearer\s+/i, '')
  if (!token) throw createError({ statusCode: 401, message: 'Missing token' })

  const sb = useSupabaseAdmin()
  const { data: { user }, error } = await sb.auth.getUser(token)
  if (error || !user) {
    console.warn('[requireUser] token validation failed:', error?.message ?? 'no user returned')
    throw createError({ statusCode: 401, message: 'Invalid token' })
  }

  return user.id
}
