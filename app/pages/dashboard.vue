<template>
  <div class="flex flex-1 flex-col overflow-hidden bg-[var(--color-surface)]">
    <!-- Header -->
    <header class="flex h-12 shrink-0 items-center gap-3 border-b px-6" style="background:#16191d;border-color:rgba(255,255,255,0.06)">
      <svg class="size-6 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" rx="6" ry="6" fill="#8e9ead"/>
        <rect x="4" y="3.91" width="8.5" height="12" rx="1.25" ry="1.25" fill="#373d43"/>
        <rect x="14.05" y="3.91" width="6" height="6.5" rx="1.25" ry="1.25" fill="#373d43"/>
        <rect x="14.05" y="11.91" width="6" height="8" rx="1.25" ry="1.25" fill="#565f69"/>
      </svg>
      <span class="text-sm font-medium text-[var(--color-text)]">snipfol<span class="text-[var(--color-accent)]">.io</span></span>
      <div class="flex-1" />
      <template v-if="authStore.isGuest">
        <span class="text-xs text-[var(--color-text-muted)]">Guest</span>
        <NuxtLink
          to="/"
          class="flex h-8 items-center rounded-[6px] px-3 text-xs text-[var(--color-text-muted)] transition hover:bg-white/5 hover:text-[var(--color-text)]"
          style="border:0.5px solid rgba(255,255,255,0.12)"
        >
          Sign in
        </NuxtLink>
      </template>
      <template v-else>
        <span class="text-xs text-[var(--color-text-muted)]">{{ authStore.user?.email }}</span>
        <a
          v-if="authStore.isPro"
          :href="billingUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="flex h-8 items-center gap-1 rounded-[6px] px-3 text-xs text-[var(--color-text-muted)] transition hover:bg-white/5 hover:text-[var(--color-text)]"
          style="border:0.5px solid rgba(255,255,255,0.12)"
        >
          Manage subscription
          <svg class="size-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
        <button
          class="flex h-8 items-center rounded-[6px] px-3 text-xs text-[var(--color-text-muted)] transition hover:bg-white/5 hover:text-[var(--color-text)]"
          style="border:0.5px solid rgba(255,255,255,0.12)"
          @click="signOut"
        >
          Sign out
        </button>
      </template>
    </header>

    <main class="flex-1 overflow-y-auto p-6">
      <div class="mx-auto max-w-4xl">
        <div class="mb-6 flex items-center justify-between">
          <h2 class="text-sm font-medium text-[var(--color-text)]">Your Projects</h2>
          <button
            class="flex h-8 items-center gap-1.5 rounded-[6px] bg-[var(--color-accent)] px-3 text-xs font-medium text-[#111316] transition hover:bg-[var(--color-accent-hover)] hover:text-[var(--color-text)]"
            @click="onNewProject"
          >
            <svg class="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New project
          </button>
        </div>

        <Transition name="fade" mode="out-in">
          <!-- Skeleton cards while loading -->
          <div v-if="loading" key="skeleton" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div
              v-for="i in 3"
              :key="i"
              class="animate-pulse rounded-xl p-4"
              style="background:#1e2228;border:0.5px solid rgba(255,255,255,0.06);border-radius:12px"
            >
              <div class="mb-3 h-32 rounded-lg bg-white/5" />
              <div class="h-3 w-3/4 rounded bg-white/5" />
              <div class="mt-2 h-2.5 w-1/3 rounded bg-white/5" />
            </div>
          </div>

          <!-- Project grid -->
          <div v-else-if="projects.length > 0" key="projects" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div
              v-for="project in projects"
              :key="project.id"
              class="group relative cursor-pointer rounded-xl p-4 transition-all"
              style="background:#1e2228;border:0.5px solid rgba(255,255,255,0.06);border-radius:12px"
              @mouseenter="($event.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.12)'"
              @mouseleave="($event.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.06)'"
              @click="openProject(project.id)"
            >
              <!-- Thumbnail preview -->
              <div class="mb-3 h-32 overflow-hidden rounded-lg bg-[var(--color-surface)]">
                <img
                  v-if="previews[project.id]"
                  :src="previews[project.id]"
                  class="h-full w-full object-cover object-top"
                  draggable="false"
                />
                <div v-else class="flex h-full items-center justify-center">
                  <svg class="size-8 text-[var(--color-border)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M13.5 12h.008v.008H13.5V12z" />
                  </svg>
                </div>
              </div>

              <p class="truncate text-sm font-medium text-[var(--color-text)]">{{ project.name }}</p>
              <p class="mt-0.5 text-xs text-[var(--color-text-muted)]">
                {{ formatDate(project.updatedAt) }}
              </p>

              <!-- Delete button -->
              <button
                class="absolute right-3 top-3 rounded-[6px] p-1 opacity-0 text-[var(--color-text-muted)] transition group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-400"
                @click.stop="confirmDelete(project.id, project.name)"
              >
                <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Empty state -->
          <div v-else key="empty" class="flex flex-col items-center justify-center py-20 text-center">
            <svg class="mb-4 size-12 text-[var(--color-border)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 7.125C2.25 6.504 2.754 6 3.375 6h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 01-1.125-1.125v-3.75zm0 9.75c0-.621.504-1.125 1.125-1.125h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 01-1.125-1.125v-3.75zm9.75-9.75c0-.621.504-1.125 1.125-1.125h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 01-1.125-1.125v-3.75zm0 9.75c0-.621.504-1.125 1.125-1.125h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 01-1.125-1.125v-3.75z" />
            </svg>
            <p class="text-sm font-medium text-[var(--color-text)]">No projects yet</p>
            <p class="mt-1 text-xs text-[var(--color-text-muted)]">Create your first project to get started</p>
          </div>
        </Transition>
      </div>
    </main>

    <!-- New project modal -->
    <AppModal :open="showNew" title="New Project" @close="showNew = false">
      <div class="space-y-3">
        <div class="space-y-1.5">
          <label class="text-xs font-medium text-[var(--color-text-muted)]">Project name</label>
          <input
            ref="nameInput"
            v-model="newName"
            class="w-full"
            placeholder="My portfolio project"
            @keydown.enter="createProject"
          />
        </div>
      </div>
      <template #footer>
        <button
          class="flex h-8 items-center rounded-[6px] px-3 text-sm text-[var(--color-text-muted)] transition hover:bg-white/10"
          @click="showNew = false"
        >
          Cancel
        </button>
        <button
          class="flex h-8 items-center rounded-[6px] bg-[var(--color-accent)] px-4 text-sm font-medium text-[#111316] transition hover:bg-[var(--color-accent-hover)] hover:text-[var(--color-text)] disabled:opacity-50"
          :disabled="!newName.trim()"
          @click="createProject"
        >
          Create
        </button>
      </template>
    </AppModal>

    <!-- Pro upsell modal -->
    <AppModal :open="showProUpsell" title="Upgrade to Pro" @close="showProUpsell = false">
      <p class="text-sm text-[var(--color-text-muted)]">
        Free accounts are limited to <strong class="text-[var(--color-text)]">1 project</strong>.
        Upgrade to Pro for unlimited projects and watermark-free exports.
      </p>
      <template #footer>
        <button
          class="flex h-8 items-center rounded-[6px] px-3 text-sm text-[var(--color-text-muted)] transition hover:bg-white/10"
          @click="showProUpsell = false"
        >
          Not now
        </button>
        <button
          class="flex h-8 items-center rounded-[6px] bg-[var(--color-accent)] px-4 text-sm font-medium text-[#111316] transition hover:bg-[var(--color-accent-hover)] hover:text-[var(--color-text)]"
          @click="startCheckout('pro_early')"
        >
          Go Pro — $9.99/mo
        </button>
      </template>
    </AppModal>

    <!-- Delete confirm -->
    <AppModal :open="!!deleteTarget" title="Delete project?" @close="deleteTarget = null">
      <p class="text-sm text-[var(--color-text-muted)]">
        Delete <strong class="text-[var(--color-text)]">{{ deleteTarget?.name }}</strong>? This cannot be undone.
      </p>
      <template #footer>
        <button
          class="flex h-8 items-center rounded-[6px] px-3 text-sm text-[var(--color-text-muted)] transition hover:bg-white/10"
          @click="deleteTarget = null"
        >
          Cancel
        </button>
        <button
          class="flex h-8 items-center rounded-[6px] bg-red-500 px-3 text-sm font-medium text-white transition hover:bg-red-600"
          @click="doDelete"
        >
          Delete
        </button>
      </template>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Dashboard — Snipfolio' })
import { useAuthStore } from '~/stores/auth'
import { useProjectStore } from '~/stores/project'
import { useAuth } from '~/composables/useAuth'
import { useProject } from '~/composables/useProject'
import { usePlan } from '~/composables/usePlan'
import { useCheckout } from '~/composables/useCheckout'

definePageMeta({ middleware: 'auth' })

const authStore = useAuthStore()
const projectStore = useProjectStore()
const { signOut: authSignOut } = useAuth()
const { fetchProjects, createProject: createProjectFn, deleteProject, loadPreview } = useProject()
const { canCreateProject } = usePlan()
const { startCheckout } = useCheckout()

const config = useRuntimeConfig()
const billingUrl = config.public.lsStoreSlug
  ? `https://${config.public.lsStoreSlug}.lemonsqueezy.com/billing`
  : 'https://app.lemonsqueezy.com/my-orders'

const projects = computed(() => projectStore.projects)
const showNew = ref(false)
const showProUpsell = ref(false)
const newName = ref('')
const nameInput = ref<HTMLInputElement>()
const deleteTarget = ref<{ id: string; name: string } | null>(null)
const previews = ref<Record<string, string>>({})
const loading = ref(true)

watch(showNew, (v) => {
  if (v) nextTick(() => nameInput.value?.focus())
})

watch(projects, (list) => {
  for (const p of list) {
    if (previews.value[p.id]) continue
    loadPreview(p.id).then((thumb) => {
      if (thumb) previews.value = { ...previews.value, [p.id]: thumb }
    })
  }
})

onMounted(async () => {
  await fetchProjects()
  loading.value = false
})

function onNewProject() {
  if (!canCreateProject()) {
    showProUpsell.value = true
  } else {
    showNew.value = true
  }
}

async function createProject() {
  if (!newName.value.trim()) return
  const project = await createProjectFn(newName.value.trim())
  showNew.value = false
  newName.value = ''
  await navigateTo(`/project/${project.id}`)
}

function openProject(id: string) {
  navigateTo(`/project/${id}`)
}

function confirmDelete(id: string, name: string) {
  deleteTarget.value = { id, name }
}

async function doDelete() {
  if (!deleteTarget.value) return
  await deleteProject(deleteTarget.value.id)
  deleteTarget.value = null
}

async function signOut() {
  await authSignOut()
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(
    new Date(iso),
  )
}
</script>
