<template>
  <NuxtLink
    v-if="authStore.isGuest"
    to="/login"
    class="flex h-8 items-center rounded-[6px] px-3 text-xs text-[var(--color-text-muted)] transition hover:bg-white/5 hover:text-[var(--color-text)] border-strong"
  >
    Sign in
  </NuxtLink>

  <AppDropdown v-else align="right">
    <template #trigger>
      <button
        class="flex size-8 items-center justify-center rounded-full bg-[var(--color-surface-3)] text-xs font-medium text-[var(--color-text)] transition hover:bg-white/10 border-strong"
        :title="authStore.user?.email"
      >
        {{ initials }}
      </button>
    </template>

    <div class="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[var(--color-text-muted)]">
      <span class="truncate">{{ authStore.user?.email }}</span>
      <span
        v-if="authStore.isPro"
        class="shrink-0 rounded-[4px] bg-[var(--color-accent-dim)] px-[5px] py-[1px] text-[9px] tracking-[0.06em] text-[var(--color-accent)] [border:0.5px_solid_rgba(142,158,173,0.25)]"
      >
        PRO
      </span>
    </div>
    <div class="my-0.5 h-px bg-[var(--color-border)]" />
    <AppDropdownItem v-if="authStore.isPro" @click="openBilling">Manage subscription</AppDropdownItem>
    <AppDropdownItem @click="signOut">Sign out</AppDropdownItem>
  </AppDropdown>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { useAuth } from '~/composables/useAuth'

const authStore = useAuthStore()
const { signOut: authSignOut } = useAuth()

const config = useRuntimeConfig()
const billingUrl = config.public.lsStoreSlug
  ? `https://${config.public.lsStoreSlug}.lemonsqueezy.com/billing`
  : 'https://app.lemonsqueezy.com/my-orders'

const initials = computed(() => authStore.user?.email?.[0]?.toUpperCase() ?? '?')

function openBilling() {
  window.open(billingUrl, '_blank', 'noopener,noreferrer')
}

async function signOut() {
  await authSignOut()
}
</script>
