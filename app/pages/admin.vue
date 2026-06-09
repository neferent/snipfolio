<template>
  <div class="flex flex-1 flex-col overflow-hidden bg-[var(--color-surface)]">
    <!-- Header -->
    <header class="flex h-12 shrink-0 items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface-2)] px-6">
      <svg class="size-6 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" rx="6" ry="6" fill="#8e9ead"/>
        <rect x="4" y="3.91" width="8.5" height="12" rx="1.25" ry="1.25" fill="#373d43"/>
        <rect x="14.05" y="3.91" width="6" height="6.5" rx="1.25" ry="1.25" fill="#373d43"/>
        <rect x="14.05" y="11.91" width="6" height="8" rx="1.25" ry="1.25" fill="#565f69"/>
      </svg>
      <span class="text-sm font-medium text-[var(--color-text)]">snipfol<span class="text-[var(--color-accent)]">.io</span></span>
      <span class="rounded bg-red-500/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-red-400">Admin</span>
      <div class="flex-1" />
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
            <button
              class="flex h-7 items-center gap-1.5 rounded-[5px] px-3 text-xs text-[var(--color-text-muted)] transition hover:bg-white/5 [border:0.5px_solid_rgba(255,255,255,0.1)]"
              @click="reload"
            >
              <RefreshCw class="size-3" />
              Refresh
            </button>
          </div>

          <!-- Users table -->
          <div class="overflow-hidden rounded-xl border-faint">
            <table class="w-full text-xs">
              <thead>
                <tr class="border-b-faint bg-[#1a1e24]">
                  <th class="px-4 py-2.5 text-left font-medium text-[var(--color-text-muted)]">Email</th>
                  <th class="px-4 py-2.5 text-left font-medium text-[var(--color-text-muted)]">Tier</th>
                  <th class="px-4 py-2.5 text-left font-medium text-[var(--color-text-muted)]">Projects</th>
                  <th class="px-4 py-2.5 text-left font-medium text-[var(--color-text-muted)]">Day Access</th>
                  <th class="px-4 py-2.5 text-left font-medium text-[var(--color-text-muted)]">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="user in users"
                  :key="user.id"
                  class="border-t border-[rgba(255,255,255,0.05)]"
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
                          ? 'background:rgba(142,158,173,0.15);color:#8e9ead'
                          : 'background:rgba(255,255,255,0.06);color:#6b7280'"
                      >
                        {{ user.isPro ? 'Pro' : 'Account' }}
                      </span>
                      <button
                        class="rounded px-2 py-0.5 text-[10px] transition text-[var(--color-accent)] [border:0.5px_solid_rgba(255,255,255,0.1)]"
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

                  <!-- Day access list -->
                  <td class="px-4 py-3">
                    <div v-if="user.dayAccess.length === 0" class="text-[var(--color-text-muted)]">none</div>
                    <div v-for="a in user.dayAccess" :key="a.projectId" class="flex items-center gap-1.5">
                      <span class="max-w-[140px] truncate text-[var(--color-text)]">{{ a.projectName }}</span>
                      <span class="text-[var(--color-text-muted)]">until {{ formatTime(a.expiresAt) }}</span>
                      <button
                        class="ml-1 rounded px-1.5 py-0.5 text-[10px] text-red-400 transition hover:bg-red-500/10"
                        @click="revokeAccess(user, a.projectId)"
                      >
                        revoke
                      </button>
                    </div>
                    <!-- Grant access picker -->
                    <div v-if="user.projectCount > 0" class="mt-1">
                      <button
                        class="text-[10px] text-[var(--color-accent)] opacity-60 transition hover:opacity-100"
                        @click="openGrantAccess(user)"
                      >
                        + Grant access
                      </button>
                    </div>
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
        This will delete <strong class="text-[var(--color-text)]">all projects, compositions, snips, and storage files</strong>
        for <strong class="text-[var(--color-text)]">{{ resetTarget?.email }}</strong>, and set their tier back to Account.
        <br /><br />Cannot be undone.
      </p>
      <template #footer>
        <button
          class="flex h-8 items-center rounded-[6px] px-3 text-sm text-[var(--color-text-muted)] transition hover:bg-white/10"
          @click="resetTarget = null"
        >
          Cancel
        </button>
        <button
          class="flex h-8 items-center rounded-[6px] bg-red-500 px-4 text-sm font-medium text-white transition hover:bg-red-600"
          @click="doReset"
        >
          Reset account
        </button>
      </template>
    </AppModal>

    <!-- Grant day access modal -->
    <AppModal :open="!!grantTarget" title="Grant 1-Day Access" @close="grantTarget = null">
      <div class="space-y-3">
        <p class="text-sm text-[var(--color-text-muted)]">
          Select the project to grant watermark-free exports for 24 hours.
        </p>
        <div class="space-y-1">
          <label
            v-for="proj in grantTarget?.projects ?? []"
            :key="proj.id"
            class="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 transition hover:bg-white/5"
          >
            <input
              type="radio"
              :value="proj.id"
              v-model="grantProjectId"
              class="accent-[var(--color-accent)]"
            />
            <span class="text-sm text-[var(--color-text)]">{{ proj.name }}</span>
          </label>
        </div>
      </div>
      <template #footer>
        <button
          class="flex h-8 items-center rounded-[6px] px-3 text-sm text-[var(--color-text-muted)] transition hover:bg-white/10"
          @click="grantTarget = null"
        >
          Cancel
        </button>
        <button
          class="flex h-8 items-center rounded-[6px] bg-[var(--color-accent)] px-4 text-sm font-medium text-[#111316] transition hover:bg-[var(--color-accent-hover)] hover:text-[var(--color-text)] disabled:opacity-50"
          :disabled="!grantProjectId"
          @click="doGrantAccess"
        >
          Grant 24h access
        </button>
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

interface DayAccess { projectId: string; projectName: string; expiresAt: string }
interface AdminUser {
  id: string
  email: string
  isPro: boolean
  isAdmin: boolean
  projectCount: number
  dayAccess: DayAccess[]
  createdAt: string
}
interface GrantTarget { user: AdminUser; projects: { id: string; name: string }[] }

const users = ref<AdminUser[]>([])
const loading = ref(true)
const loadError = ref('')
const busyUser = ref<string | null>(null)
const resetTarget = ref<AdminUser | null>(null)
const grantTarget = ref<GrantTarget | null>(null)
const grantProjectId = ref<string | null>(null)

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

async function openGrantAccess(user: AdminUser) {
  // Fetch this user's projects via the users list (we already have projectCount; fetch names)
  const sb = await fetchUserProjects(user.id)
  grantTarget.value = { user, projects: sb }
  grantProjectId.value = null
}

async function fetchUserProjects(userId: string): Promise<{ id: string; name: string }[]> {
  // Admin API doesn't have a separate projects endpoint — we re-fetch from the users list
  // and match by user_id. For now, use a lightweight inline approach.
  const allUsers = await $fetch<AdminUser[]>('/api/admin/users', { headers: authHeaders() })
  const u = allUsers.find((u) => u.id === userId)
  // We need project names — add a dedicated endpoint or call supabase directly.
  // Since we have day access with project names, extract from there as a best-effort,
  // then prompt for the project ID input if none found.
  // Instead, add a dedicated endpoint: /api/admin/users/[id]/projects
  const projects = await $fetch<{ id: string; name: string }[]>(
    `/api/admin/users/${userId}/projects`,
    { headers: authHeaders() },
  ).catch(() => [] as { id: string; name: string }[])
  return projects
}

async function doGrantAccess() {
  if (!grantTarget.value || !grantProjectId.value) return
  const { user } = grantTarget.value
  const projectId = grantProjectId.value
  busyUser.value = user.id
  grantTarget.value = null
  try {
    await $fetch(`/api/admin/projects/${projectId}/access`, {
      method: 'POST',
      headers: authHeaders(),
      body: { userId: user.id },
    })
    await reload()
  } finally {
    busyUser.value = null
  }
}

async function revokeAccess(user: AdminUser, projectId: string) {
  busyUser.value = user.id
  try {
    await $fetch(`/api/admin/projects/${projectId}/access`, {
      method: 'DELETE',
      headers: authHeaders(),
      body: { userId: user.id },
    })
    user.dayAccess = user.dayAccess.filter((a) => a.projectId !== projectId)
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
