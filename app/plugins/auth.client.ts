import { useAuth } from '~/composables/useAuth'

// Runs once on the client before any page mounts.
// Populates the auth store (user, token, isPro, isAdmin) from the existing session.
export default defineNuxtPlugin(async () => {
  const { restoreSession } = useAuth()
  await restoreSession()
})
