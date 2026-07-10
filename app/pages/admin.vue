<template>
  <div class="flex flex-1 flex-col overflow-hidden bg-[var(--color-surface)]">
    <!-- Header -->
    <header class="flex h-12 shrink-0 items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface-2)] px-6">
      <AppLogo />
      <span class="rounded bg-red-500/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-red-400">Admin</span>
      <div class="flex-1" />
      <ThemeToggle />
      <NuxtLink to="/dashboard" class="text-xs text-[var(--color-text-muted)] transition hover:text-[var(--color-text)]">
        Dashboard
      </NuxtLink>
    </header>

    <main class="flex-1 overflow-y-auto p-6">
      <div class="mx-auto max-w-5xl space-y-6">

        <!-- Loading / error -->
        <div v-if="loading" class="py-12 text-center text-sm text-[var(--color-text-muted)]">Loading users…</div>
        <div v-else-if="loadError" class="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">{{ loadError }}</div>

        <template v-else>
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-medium text-[var(--color-text)]">Users ({{ users.length }})</h2>
            <AppButton variant="secondary" size="sm" @click="reload">
              <RefreshCw class="size-3" />
              Refresh
            </AppButton>
          </div>

          <!-- Users table -->
          <div class="overflow-hidden rounded-xl border-faint">
            <table class="w-full text-xs">
              <thead>
                <tr class="border-b-faint bg-[#1a1e24]">
                  <th class="px-4 py-2.5 text-left font-medium text-[var(--color-text-muted)]">Email</th>
                  <th class="px-4 py-2.5 text-left font-medium text-[var(--color-text-muted)]">Tier</th>
                  <th class="px-4 py-2.5 text-left font-medium text-[var(--color-text-muted)]">Projects</th>
                  <th class="px-4 py-2.5 text-left font-medium text-[var(--color-text-muted)]">Captures</th>
                  <th class="px-4 py-2.5 text-left font-medium text-[var(--color-text-muted)]">Day Pass</th>
                  <th class="px-4 py-2.5 text-left font-medium text-[var(--color-text-muted)]">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="user in users"
                  :key="user.id"
                  class="border-t border-[var(--color-border)]"
                >
                  <!-- Email -->
                  <td class="px-4 py-3 text-[var(--color-text)]">
                    {{ user.email || '(no email)' }}
                    <span v-if="user.isAdmin" class="ml-1.5 rounded bg-red-500/15 px-1 py-0.5 text-[10px] text-red-400">admin</span>
                  </td>

                  <!-- Tier badge + toggle -->
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-2">
                      <span
                        class="rounded-full px-2 py-0.5 text-[10px] font-medium"
                        :style="user.isPro
                          ? 'background:rgba(142,158,173,0.15);color:var(--color-accent)'
                          : 'background:var(--color-surface-3);color:var(--color-text-muted)'"
                      >
                        {{ user.isPro ? 'Pro' : 'Account' }}
                      </span>
                      <button
                        class="rounded px-2 py-0.5 text-[10px] transition text-[var(--color-accent)] [border:0.5px_solid_var(--color-border-strong)]"
                        :disabled="busyUser === user.id"
                        @click="togglePro(user)"
                      >
                        {{ user.isPro ? 'Remove Pro' : 'Make Pro' }}
                      </button>
                    </div>
                  </td>

                  <!-- Project count -->
                  <td class="px-4 py-3 text-[var(--color-text-muted)]">
                    {{ user.projectCount }}
                  </td>

                  <!-- Captures -->
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-1.5">
                      <span class="text-[var(--color-text-muted)]">{{ user.capturesUsed }}/{{ user.captureLimit }}</span>
                      <button
                        class="rounded px-1.5 py-0.5 text-[10px] text-[var(--color-accent)] transition hover:bg-overlay/5 disabled:opacity-40"
                        :disabled="busyUser === user.id || user.capturesUsed === 0"
                        @click="resetCaptures(user)"
                      >
                        reset
                      </button>
                    </div>
                  </td>

                  <!-- Day pass -->
                  <td class="px-4 py-3">
                    <div v-if="isDayPassActive(user)" class="flex items-center gap-1.5">
                      <span class="text-[var(--color-text-muted)]">until {{ formatTime(user.proExpiresAt!) }}</span>
                      <button
                        class="ml-1 rounded px-1.5 py-0.5 text-[10px] text-red-400 transition hover:bg-red-500/10"
                        :disabled="busyUser === user.id"
                        @click="revokeDayPass(user)"
                      >
                        revoke
                      </button>
                    </div>
                    <button
                      v-else
                      class="text-[10px] text-[var(--color-accent)] opacity-60 transition hover:opacity-100"
                      :disabled="busyUser === user.id"
                      @click="grantDayPass(user)"
                    >
                      + Grant 3-Day Pass
                    </button>
                  </td>

                  <!-- Actions -->
                  <td class="px-4 py-3">
                    <button
                      v-if="user.id !== authStore.user?.id"
                      class="rounded-[5px] px-2.5 py-1 text-[11px] text-red-400 transition hover:bg-red-500/15 [border:0.5px_solid_rgba(239,68,68,0.25)]"
                      :disabled="busyUser === user.id"
                      @click="confirmReset(user)"
                    >
                      Reset account
                    </button>
                    <span v-else class="text-[11px] text-[var(--color-text-muted)] opacity-40">—</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </div>
    </main>

    <!-- Reset confirm modal -->
    <AppModal :open="!!resetTarget" title="Reset account?" @close="resetTarget = null">
      <p class="text-sm text-[var(--color-text-muted)]">
        This will delete <strong class="text-[var(--color-text)]">all projects, mockups, snips, and storage files</strong>
        for <strong class="text-[var(--color-text)]">{{ resetTarget?.email }}</strong>, and set their tier back to Account.
        <br /><br />Cannot be undone.
      </p>
      <template #footer>
        <AppButton variant="ghost" @click="resetTarget = null">
          Cancel
        </AppButton>
        <AppButton variant="danger" @click="doReset">
          Reset account
        </AppButton>
      </template>
    </AppModal>

  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Admin — Snipfolio' })
import { RefreshCw } from 'lucide-vue-next'
import { useAuthStore } from '~/stores/auth'
import { useAuth } from '~/composables/useAuth'

definePageMeta({ middleware: 'auth' })

const authStore = useAuthStore()

interface AdminUser {
  id: string
  email: string
  isPro: boolean
  isAdmin: boolean
  projectCount: number
  proExpiresAt: string | null
  createdAt: string
  capturesUsed: number
  captureLimit: number
}

const users = ref<AdminUser[]>([])
const loading = ref(true)
const loadError = ref('')
const busyUser = ref<string | null>(null)
const resetTarget = ref<AdminUser | null>(null)

// Plugin already ran restoreSession before this page mounted — isAdmin is ready
onMounted(async () => {
  if (!authStore.isAdmin) {
    await navigateTo('/dashboard')
    return
  }
  await reload()
})

function authHeaders() {
  return { Authorization: `Bearer ${authStore.token}` }
}

async function reload() {
  loading.value = true
  loadError.value = ''
  try {
    users.value = await $fetch<AdminUser[]>('/api/admin/users', { headers: authHeaders() })
  } catch (e: unknown) {
    loadError.value = (e as Error).message ?? 'Failed to load users'
  } finally {
    loading.value = false
  }
}

async function togglePro(user: AdminUser) {
  busyUser.value = user.id
  try {
    await $fetch(`/api/admin/users/${user.id}/set-pro`, {
      method: 'POST',
      headers: authHeaders(),
      body: { isPro: !user.isPro },
    })
    user.isPro = !user.isPro
  } finally {
    busyUser.value = null
  }
}

function confirmReset(user: AdminUser) {
  resetTarget.value = user
}

async function doReset() {
  if (!resetTarget.value) return
  const user = resetTarget.value
  busyUser.value = user.id
  resetTarget.value = null
  try {
    await $fetch(`/api/admin/users/${user.id}/reset`, {
      method: 'POST',
      headers: authHeaders(),
    })
    await reload()
  } finally {
    busyUser.value = null
  }
}

async function resetCaptures(user: AdminUser) {
  busyUser.value = user.id
  try {
    await $fetch(`/api/admin/users/${user.id}/reset-captures`, {
      method: 'POST',
      headers: authHeaders(),
    })
    user.capturesUsed = 0
  } finally {
    busyUser.value = null
  }
}

function isDayPassActive(user: AdminUser): boolean {
  return !!user.proExpiresAt && new Date(user.proExpiresAt) > new Date()
}

async function grantDayPass(user: AdminUser) {
  busyUser.value = user.id
  try {
    const { expiresAt } = await $fetch<{ expiresAt: string }>(`/api/admin/users/${user.id}/day-pass`, {
      method: 'POST',
      headers: authHeaders(),
    })
    user.proExpiresAt = expiresAt
  } finally {
    busyUser.value = null
  }
}

async function revokeDayPass(user: AdminUser) {
  busyUser.value = user.id
  try {
    await $fetch(`/api/admin/users/${user.id}/day-pass`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
    user.proExpiresAt = null
  } finally {
    busyUser.value = null
  }
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function until(predicate: () => boolean): Promise<void> {
  return new Promise((resolve) => {
    const check = () => {
      if (predicate()) resolve()
      else requestAnimationFrame(check)
    }
    check()
  })
}
</script>
