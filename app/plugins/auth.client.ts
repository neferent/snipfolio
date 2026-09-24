import { useAuthStore } from '~/stores/auth'

// Purely local app — no session to restore, just make sure a stable local
// user id exists (used as Project.userId) before any page mounts.
export default defineNuxtPlugin(() => {
  useAuthStore().ensureLocalUser()
})
