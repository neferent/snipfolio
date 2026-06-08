<template>
  <div class="flex h-full items-center justify-center bg-[var(--color-surface)]">
    <div class="w-full max-w-sm px-4">
      <div class="mb-8 text-center">
        <svg class="mx-auto mb-4 size-12" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
          <rect width="48" height="48" rx="12" ry="12" fill="#8e9ead"/>
          <rect x="8" y="7.82" width="17" height="24" rx="2.5" ry="2.5" fill="#373d43"/>
          <rect x="28.1" y="7.82" width="12" height="13" rx="2.5" ry="2.5" fill="#373d43"/>
          <rect x="28.1" y="23.82" width="12" height="16" rx="2.5" ry="2.5" fill="#565f69"/>
        </svg>
        <h1 class="text-3xl font-medium tracking-tight text-[var(--color-text)]">
          snipfol<span class="text-[var(--color-accent)]">.io</span>
        </h1>
      </div>

      <div class="p-6" style="background:#1e2228;border:0.5px solid rgba(255,255,255,0.12);border-radius:16px">
        <h2 class="mb-5 text-sm font-medium text-[var(--color-text)]">Set new password</h2>

        <div v-if="!ready" class="text-center text-xs text-[var(--color-text-muted)]">
          Verifying reset link…
        </div>

        <div v-else-if="done" class="space-y-4">
          <div class="rounded-[6px] bg-emerald-500/15 px-3 py-2 text-xs text-emerald-400">
            Password updated. Redirecting…
          </div>
        </div>

        <form v-else class="space-y-4" @submit.prevent="submit">
          <div class="space-y-1.5">
            <label class="text-xs font-medium text-[var(--color-text-muted)]">New password</label>
            <input
              v-model="password"
              type="password"
              autocomplete="new-password"
              required
              minlength="8"
              class="w-full"
              placeholder="••••••••"
            />
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-medium text-[var(--color-text-muted)]">Confirm password</label>
            <input
              v-model="confirm"
              type="password"
              autocomplete="new-password"
              required
              class="w-full"
              placeholder="••••••••"
            />
          </div>

          <div v-if="error" class="rounded-[6px] bg-red-500/15 px-3 py-2 text-xs text-red-400">
            {{ error }}
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="flex h-9 w-full items-center justify-center rounded-[6px] bg-[var(--color-accent)] text-sm font-medium transition hover:bg-[var(--color-accent-hover)] hover:text-[var(--color-text)] disabled:opacity-60"
            style="color:#111316"
          >
            <svg v-if="loading" class="mr-2 size-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {{ loading ? '…' : 'Update password' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: [] })
useHead({ title: 'Reset password — Snipfolio' })

import { toast } from '~/composables/useToast'

const { updatePassword } = useAuth()

const password = ref('')
const confirm = ref('')
const loading = ref(false)
const error = ref('')
const ready = ref(false)
const done = ref(false)

onMounted(async () => {
  const supabase = useSupabaseClient()
  // If arriving from /auth/confirm, session is already set
  const { data } = await supabase.auth.getSession()
  if (data.session) {
    ready.value = true
    return
  }
  // If arriving directly from email with hash token
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
      ready.value = true
    }
  })
})

async function submit() {
  error.value = ''
  if (password.value !== confirm.value) {
    error.value = 'Passwords do not match'
    return
  }
  loading.value = true
  try {
    await updatePassword(password.value)
    done.value = true
    toast.success('Password updated')
    setTimeout(() => navigateTo('/dashboard'), 1500)
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to update password'
    toast.error(error.value)
  } finally {
    loading.value = false
  }
}
</script>
