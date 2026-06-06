<template>
  <div v-if="!checking" class="flex h-full items-center justify-center bg-[var(--color-surface)]">
    <div class="w-full max-w-sm px-4">
      <!-- Logo / title -->
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
        <p class="mt-2 text-sm text-[var(--color-text-muted)]">
          Screenshot dissection &amp; portfolio composition
        </p>
      </div>

      <!-- Sign in / Sign up form -->
      <div class="p-6" style="background:#1e2228;border:0.5px solid rgba(255,255,255,0.12);border-radius:16px">
        <div class="mb-5 flex items-center justify-between">
          <h2 class="text-sm font-medium text-[var(--color-text)]">{{ isSignUp ? 'Create account' : 'Sign in' }}</h2>
          <button
            v-if="authMode !== 'local'"
            class="text-xs text-[var(--color-accent)] hover:underline"
            type="button"
            @click="toggleMode"
          >
            {{ isSignUp ? 'Sign in instead' : 'Create account' }}
          </button>
        </div>

        <form class="space-y-4" @submit.prevent="submit">
          <div class="space-y-1.5">
            <label class="text-xs font-medium text-[var(--color-text-muted)]">Email</label>
            <input
              v-model="email"
              type="email"
              autocomplete="email"
              required
              class="w-full"
              placeholder="you@example.com"
            />
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-medium text-[var(--color-text-muted)]">Password</label>
            <input
              v-model="password"
              type="password"
              :autocomplete="isSignUp ? 'new-password' : 'current-password'"
              required
              class="w-full"
              placeholder="••••••••"
            />
          </div>

          <div v-if="error" class="rounded-[6px] bg-red-500/15 px-3 py-2 text-xs text-red-400">
            {{ error }}
          </div>

          <div v-if="message" class="rounded-[6px] bg-emerald-500/15 px-3 py-2 text-xs text-emerald-400">
            {{ message }}
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
            {{ loading ? '…' : isSignUp ? 'Create account' : 'Sign in' }}
          </button>
        </form>
      </div>

      <div class="mt-4 flex items-center gap-3">
        <div class="h-px flex-1 bg-[var(--color-border)]" />
        <span class="text-xs text-[var(--color-text-muted)]">or</span>
        <div class="h-px flex-1 bg-[var(--color-border)]" />
      </div>

      <button
        class="mt-4 flex h-9 w-full items-center justify-center rounded-[6px] text-sm text-[var(--color-text-muted)] transition hover:bg-white/5 hover:text-[var(--color-text)]"
        style="border:0.5px solid rgba(255,255,255,0.12)"
        @click="continueAsGuest"
      >
        Continue without an account
      </button>

      <p class="mt-3 text-center text-xs text-[var(--color-text-muted)]">
        Exports will include a watermark
      </p>

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

const { signIn: authSignIn, signUp: authSignUp, restoreSession, continueAsGuest } = useAuth()
const authStore = useAuthStore()
const config = useRuntimeConfig()

const email = ref(config.public.authMode === 'local' ? config.public.localDevEmail : '')
const password = ref('')
const loading = ref(false)
const error = ref('')
const message = ref('')
const isSignUp = ref(false)
const checking = ref(true)
const authMode = computed(() => config.public.authMode)

onMounted(async () => {
  await restoreSession()
  if (authStore.isAuthenticated) {
    await navigateTo('/dashboard')
  } else {
    checking.value = false
  }
})

function toggleMode() {
  isSignUp.value = !isSignUp.value
  error.value = ''
  message.value = ''
  password.value = ''
}

async function submit() {
  error.value = ''
  message.value = ''
  loading.value = true
  try {
    if (isSignUp.value) {
      await authSignUp(email.value, password.value)
      if (authStore.isAuthenticated) {
        await navigateTo('/dashboard')
      } else {
        message.value = 'Check your email to confirm your account.'
      }
    } else {
      await authSignIn(email.value, password.value)
      await navigateTo('/dashboard')
    }
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : isSignUp.value ? 'Sign up failed' : 'Sign in failed'
  } finally {
    loading.value = false
  }
}
</script>
