<template>
  <div v-if="!checking" class="flex h-full items-center justify-center bg-[var(--color-surface)]">
    <div class="w-full max-w-sm px-4">
      <!-- Logo / title -->
      <div class="mb-8 text-center">
        <svg class="mx-auto mb-4 size-12" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
          <rect width="48" height="48" rx="12" ry="12" style="fill: var(--color-brand-300)"/>
          <rect x="8" y="7.82" width="17" height="24" rx="2.5" ry="2.5" style="fill: var(--color-brand-700)"/>
          <rect x="28.1" y="7.82" width="12" height="13" rx="2.5" ry="2.5" style="fill: var(--color-brand-700)"/>
          <rect x="28.1" y="23.82" width="12" height="16" rx="2.5" ry="2.5" style="fill: var(--color-brand-500)"/>
        </svg>
        <h1 class="text-3xl font-medium tracking-tight text-[var(--color-text)]">
          snipfol<span class="text-[var(--color-accent)]">.io</span>
        </h1>
        <p class="mt-2 text-sm text-[var(--color-text-muted)]">
          Screenshot dissection &amp; portfolio composition
        </p>
      </div>

      <!-- Sign in / Sign up / Forgot password form -->
      <div class="p-6 bg-[var(--color-surface-3)] border-strong rounded-2xl">
        <div class="mb-5 flex items-center justify-between">
          <h2 class="text-sm font-medium text-[var(--color-text)]">
            {{ isForgotPassword ? 'Reset password' : isSignUp ? 'Create account' : 'Sign in' }}
          </h2>
          <button
            v-if="!isForgotPassword"
            class="text-xs text-[var(--color-accent)] hover:underline"
            type="button"
            @click="toggleMode"
          >
            {{ isSignUp ? 'Sign in instead' : 'Create account' }}
          </button>
          <button
            v-else
            class="text-xs text-[var(--color-accent)] hover:underline"
            type="button"
            @click="isForgotPassword = false; error = ''; message = ''"
          >
            Back to sign in
          </button>
        </div>

        <!-- Forgot password form -->
        <form v-if="isForgotPassword" class="space-y-4" @submit.prevent="submitForgotPassword">
          <p class="text-xs text-[var(--color-text-muted)]">Enter your email and we'll send you a reset link.</p>
          <div class="space-y-1.5">
            <label class="text-xs font-medium text-[var(--color-text-muted)]">Email</label>
            <AppInput
              v-model="email"
              type="email"
              autocomplete="email"
              required
              placeholder="you@example.com"
            />
          </div>

          <div v-if="error" class="rounded-[6px] bg-danger/15 px-3 py-2 text-xs text-danger">
            {{ error }}
          </div>
          <div v-if="message" class="rounded-[6px] bg-info/15 px-3 py-2 text-xs text-info">
            {{ message }}
          </div>

          <AppButton type="submit" size="lg" :disabled="loading" class="w-full">
            <svg v-if="loading" class="mr-2 size-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {{ loading ? '...' : 'Send reset link' }}
          </AppButton>
        </form>

        <!-- Sign in / Sign up form -->
        <form v-else class="space-y-4" @submit.prevent="submit">
          <div class="space-y-1.5">
            <label class="text-xs font-medium text-[var(--color-text-muted)]">Email</label>
            <AppInput
              v-model="email"
              type="email"
              autocomplete="email"
              required
              placeholder="you@example.com"
            />
          </div>

          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <label class="text-xs font-medium text-[var(--color-text-muted)]">Password</label>
              <button
                v-if="!isSignUp"
                type="button"
                tabindex="-1"
                class="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-accent)]"
                @click="isForgotPassword = true; error = ''; message = ''"
              >
                Forgot password?
              </button>
            </div>
            <AppInput
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              :autocomplete="isSignUp ? 'new-password' : 'current-password'"
              required
              placeholder="••••••••"
            >
              <template #suffix>
                <button type="button" tabindex="-1" class="hover:text-[var(--color-text)]" @click="showPassword = !showPassword">
                  <svg v-if="showPassword" class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                  <svg v-else class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              </template>
            </AppInput>
          </div>

          <div v-if="error" class="rounded-[6px] bg-danger/15 px-3 py-2 text-xs text-danger">
            {{ error }}
          </div>

          <div v-if="message" class="rounded-[6px] bg-info/15 px-3 py-2 text-xs text-info">
            {{ message }}
          </div>

          <AppButton type="submit" size="lg" :disabled="loading" class="w-full">
            <svg v-if="loading" class="mr-2 size-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {{ loading ? '...' : isSignUp ? 'Create account' : 'Sign in' }}
          </AppButton>
        </form>
      </div>

      <div class="mt-4 flex items-center gap-3">
        <div class="h-px flex-1 bg-[var(--color-border)]" />
        <span class="text-xs text-[var(--color-text-muted)]">or</span>
        <div class="h-px flex-1 bg-[var(--color-border)]" />
      </div>

      <AppButton variant="secondary" size="lg" class="mt-4 w-full" @click="continueAsGuest">
        Continue without an account
      </AppButton>

      <p class="mt-3 text-center text-xs text-[var(--color-text-muted)]">
        Exports will include a watermark
      </p>

    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: [], ssr: false })
useHead({ title: 'Sign in -- Snipfolio' })

import { useAuth, getAuthErrorMessage } from '~/composables/useAuth'
import { useAuthStore } from '~/stores/auth'
import { toast } from '~/composables/useToast'
import { useResumePostAuth } from '~/composables/useResumePostAuth'

const { signIn: authSignIn, signUp: authSignUp, continueAsGuest, sendPasswordReset } = useAuth()
const authStore = useAuthStore()
const { resume: resumePostAuth } = useResumePostAuth()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')
const message = ref('')
const isSignUp = ref(false)
const isForgotPassword = ref(false)
const checking = ref(true)

onMounted(async () => {
  if (authStore.isAuthenticated && !authStore.isGuest) {
    await navigateTo('/dashboard')
  } else {
    checking.value = false
  }
})

function toggleMode() {
  isSignUp.value = !isSignUp.value
  isForgotPassword.value = false
  error.value = ''
  message.value = ''
  password.value = ''
  showPassword.value = false
}

async function submitForgotPassword() {
  error.value = ''
  message.value = ''
  loading.value = true
  try {
    await sendPasswordReset(email.value)
    message.value = "If an account exists for that email, you'll receive a reset link shortly."
    toast.success('Check your inbox', { description: message.value })
  } catch (e: unknown) {
    error.value = getAuthErrorMessage(e, 'Failed to send reset email')
    toast.error(error.value)
  } finally {
    loading.value = false
  }
}

async function submit() {
  error.value = ''
  message.value = ''
  loading.value = true
  try {
    if (isSignUp.value) {
      await authSignUp(email.value, password.value)
      if (authStore.isAuthenticated) {
        await resumePostAuth()
      } else {
        message.value = 'Check your email to confirm your account.'
      }
    } else {
      await authSignIn(email.value, password.value)
      await resumePostAuth()
    }
  } catch (e: unknown) {
    error.value = getAuthErrorMessage(e, isSignUp.value ? 'Sign up failed' : 'Sign in failed')
    toast.error(error.value)
  } finally {
    loading.value = false
  }
}
</script>
