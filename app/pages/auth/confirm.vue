<template>
  <div class="flex h-full flex-col items-center justify-center gap-3 bg-[var(--color-surface)]">
    <div class="text-sm text-[var(--color-text-muted)]">{{ status }}</div>
    <NuxtLink
      v-if="showLoginLink"
      to="/login"
      class="text-xs text-[var(--color-accent)] underline"
    >
      Back to sign in
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import { useResumePostAuth } from '~/composables/useResumePostAuth'
import { initSupabaseClient } from '~/composables/useSupabaseClient'
import { useAuth } from '~/composables/useAuth'

definePageMeta({ layout: 'default', middleware: [] })

const status = ref('Verifying…')
const showLoginLink = ref(false)
const route = useRoute()

const VERIFY_TIMEOUT_MS = 15_000

function withTimeout<T>(promise: Promise<T>): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), VERIFY_TIMEOUT_MS),
    ),
  ])
}

function fail(message: string) {
  status.value = message
  showLoginLink.value = true
}

onMounted(async () => {
  try {
    await initSupabaseClient()
    const supabase = useSupabaseClient()!
    const token_hash = route.query.token_hash as string
    let type = route.query.type as string

    if (token_hash && type) {
      const { error } = await withTimeout<{ error: unknown }>(
        supabase.auth.verifyOtp({ token_hash, type: type as any }),
      )
      if (error) {
        fail('Link expired or invalid. Please request a new one.')
        return
      }
    } else {
      // Supabase's hosted /auth/v1/verify redirect doesn't carry token_hash/type as
      // query params — it sets the session via a #access_token=... hash fragment,
      // which the client picks up automatically via detectSessionInUrl.
      const hashParams = new URLSearchParams(window.location.hash.slice(1))
      type = hashParams.get('type') ?? ''
      const { data } = await withTimeout<{ data: { session: unknown } }>(supabase.auth.getSession())
      if (!data.session) {
        fail('Invalid link.')
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
    await withTimeout(restoreSession())

    await useResumePostAuth().resume()
  } catch (e) {
    if (e instanceof Error && e.message === 'timeout') {
      fail('This is taking longer than expected. Check your connection and try again.')
    } else {
      fail('Something went wrong verifying your link. Please try again.')
    }
  }
})
</script>
