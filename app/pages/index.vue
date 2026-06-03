<template>
  <div class="flex h-full items-center justify-center bg-[var(--color-surface)]">
    <div class="w-full max-w-sm px-4">
      <!-- Logo / title -->
      <div class="mb-8 text-center">
        <h1 class="text-3xl font-bold tracking-tight text-[var(--color-text)]">Snipfolio</h1>
        <p class="mt-2 text-sm text-[var(--color-text-muted)]">
          Screenshot dissection &amp; portfolio composition
        </p>
      </div>

      <!-- Sign in form -->
      <div class="rounded-xl bg-[var(--color-surface-2)] p-6 shadow-xl ring-1 ring-white/5">
        <h2 class="mb-5 text-sm font-semibold text-[var(--color-text)]">Sign in</h2>

        <form class="space-y-4" @submit.prevent="signIn">
          <div class="space-y-1.5">
            <label class="text-xs font-medium text-[var(--color-text-muted)]">Email</label>
            <input
              v-model="email"
              type="email"
              autocomplete="email"
              required
              class="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-3)] px-3 py-2 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-accent)]"
              placeholder="you@example.com"
            />
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-medium text-[var(--color-text-muted)]">Password</label>
            <input
              v-model="password"
              type="password"
              autocomplete="current-password"
              required
              class="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-3)] px-3 py-2 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-accent)]"
              placeholder="••••••••"
            />
          </div>

          <div v-if="error" class="rounded-lg bg-red-500/15 px-3 py-2 text-xs text-red-400">
            {{ error }}
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="flex w-full items-center justify-center rounded-lg bg-[var(--color-accent)] py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-hover)] disabled:opacity-60"
          >
            <svg v-if="loading" class="mr-2 size-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {{ loading ? 'Signing in…' : 'Sign in' }}
          </button>
        </form>
      </div>

      <p v-if="authMode === 'local'" class="mt-4 text-center text-xs text-[var(--color-text-muted)]">
        Local auth mode — use .env credentials
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuth } from '~/composables/useAuth'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ middleware: [] })

const { signIn: authSignIn, restoreSession } = useAuth()
const authStore = useAuthStore()
const config = useRuntimeConfig()

const email = ref(config.public.authMode === 'local' ? config.public.localDevEmail : '')
const password = ref('')
const loading = ref(false)
const error = ref('')
const authMode = computed(() => config.public.authMode)

onMounted(async () => {
  await restoreSession()
  if (authStore.isAuthenticated) {
    await navigateTo('/dashboard')
  }
})

async function signIn() {
  error.value = ''
  loading.value = true
  try {
    await authSignIn(email.value, password.value)
    await navigateTo('/dashboard')
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Sign in failed'
  } finally {
    loading.value = false
  }
}
</script>
