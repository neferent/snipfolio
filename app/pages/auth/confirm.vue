<template>
  <div class="flex h-full items-center justify-center bg-[var(--color-surface)]">
    <div class="text-sm text-[var(--color-text-muted)]">{{ status }}</div>
  </div>
</template>

<script setup lang="ts">
import { useResumePostAuth } from '~/composables/useResumePostAuth'
import { initSupabaseClient } from '~/composables/useSupabaseClient'
import { useAuth } from '~/composables/useAuth'

definePageMeta({ layout: 'default', middleware: [] })

const status = ref('Verifying…')
const route = useRoute()

onMounted(async () => {
  await initSupabaseClient()
  const supabase = useSupabaseClient()!
  const token_hash = route.query.token_hash as string
  let type = route.query.type as string

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type: type as any })
    if (error) {
      status.value = 'Link expired or invalid. Please request a new one.'
      return
    }
  } else {
    // Supabase's hosted /auth/v1/verify redirect doesn't carry token_hash/type as
    // query params — it sets the session via a #access_token=... hash fragment,
    // which the client picks up automatically via detectSessionInUrl.
    const hashParams = new URLSearchParams(window.location.hash.slice(1))
    type = hashParams.get('type') ?? ''
    const { data } = await supabase.auth.getSession()
    if (!data.session) {
      status.value = 'Invalid link.'
      return
    }
  }

  if (type === 'recovery') {
    await navigateTo('/reset-password')
    return
  }

  // Ensure the auth store (token, profile) is populated from the new session
  // before resuming — startCheckout needs a token if the user was mid-checkout.
  const { restoreSession } = useAuth()
  await restoreSession()

  await useResumePostAuth().resume()
})
</script>
