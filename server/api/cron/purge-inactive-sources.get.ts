const INACTIVITY_MS = 30 * 24 * 60 * 60 * 1000

/**
 * Removes stored screenshot bytes (not DB rows) for free-tier accounts that have
 * gone quiet for 30+ days. Accounts that have ever paid (has_ever_paid) are permanently
 * exempt, even if their Pro/day-pass status has since lapsed. Triggered daily by
 * Vercel Cron (see vercel.json), authenticated via the CRON_SECRET env var.
 */
export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, 'authorization') ?? ''
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const sb = useSupabaseAdmin()
  const cutoff = new Date(Date.now() - INACTIVITY_MS).toISOString()

  const { data: profiles, error: profilesError } = await sb
    .from('profiles')
    .select('id')
    .eq('has_ever_paid', false)
    .lt('last_active_at', cutoff)

  if (profilesError) throw createError({ statusCode: 500, message: profilesError.message })

  let accountsProcessed = 0
  let filesRemoved = 0

  for (const profile of profiles ?? []) {
    const { data: projects, error: projectsError } = await sb
      .from('projects')
      .select('id')
      .eq('user_id', profile.id)
    if (projectsError) {
      console.error('[cron/purge] failed to list projects for', profile.id, projectsError)
      continue
    }

    for (const project of projects ?? []) {
      const prefix = `${profile.id}/${project.id}`
      const { data: files, error: listError } = await sb.storage.from('screenshots').list(prefix)
      if (listError) {
        console.error('[cron/purge] failed to list storage for', prefix, listError)
        continue
      }
      if (!files || files.length === 0) continue

      const paths = files.map((f) => `${prefix}/${f.name}`)
      const { error: removeError } = await sb.storage.from('screenshots').remove(paths)
      if (removeError) {
        console.error('[cron/purge] failed to remove storage for', prefix, removeError)
        continue
      }
      filesRemoved += paths.length
    }

    accountsProcessed++
  }

  console.log(`[cron/purge] processed ${accountsProcessed} inactive free accounts, removed ${filesRemoved} files`)
  return { ok: true, accountsProcessed, filesRemoved }
})
