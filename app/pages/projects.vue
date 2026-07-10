<template>
  <div class="flex flex-1 flex-col overflow-hidden bg-[var(--color-surface)]">
    <!-- Header -->
    <header class="flex h-12 shrink-0 items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 md:px-6">
      <AppLogo />
      <NuxtLink
        to="/dashboard"
        class="ml-1 flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] transition hover:text-[var(--color-text)]"
      >
        <svg class="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Studio
      </NuxtLink>
      <div class="flex-1" />

      <ThemeToggle />

      <!-- Desktop auth items -->
      <template v-if="!isMobile">
        <template v-if="authStore.isGuest">
          <span class="text-xs text-[var(--color-text-muted)]">Guest</span>
          <NuxtLink
            to="/login"
            class="flex h-8 items-center rounded-[6px] px-3 text-xs text-[var(--color-text-muted)] transition hover:bg-overlay/5 hover:text-[var(--color-text)] border-strong"
          >
            Sign in
          </NuxtLink>
        </template>
        <template v-else>
          <span class="text-xs text-[var(--color-text-muted)]">{{ authStore.user?.email }}</span>
          <span
            v-if="isDayPassActive"
            class="rounded-[4px] bg-[var(--color-accent-dim)] px-[5px] py-[1px] text-[9px] tracking-[0.06em] text-[var(--color-accent)] [border:0.5px_solid_rgba(142,158,173,0.25)]"
          >
            Pass active until {{ formatPassExpiry(dayPassExpiresAt!) }}
          </span>
          <span
            v-else-if="authStore.isPro"
            class="rounded-[4px] bg-[var(--color-accent-dim)] px-[5px] py-[1px] text-[9px] tracking-[0.06em] text-[var(--color-accent)] [border:0.5px_solid_rgba(142,158,173,0.25)]"
          >
            Access active
          </span>
          <a
            v-if="authStore.isPro"
            :href="billingUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="flex h-8 items-center gap-1 rounded-[6px] px-3 text-xs text-[var(--color-text-muted)] transition hover:bg-overlay/5 hover:text-[var(--color-text)] border-strong"
          >
            Manage subscription
            <svg class="size-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
          <AppButton variant="secondary" @click="signOut">
            Sign out
          </AppButton>
        </template>
      </template>

      <!-- Mobile menu -->
      <template v-else>
        <AppDropdown align="right">
          <template #trigger>
            <button class="flex size-8 items-center justify-center rounded-[6px] text-[var(--color-text-muted)] transition hover:bg-overlay/5 active:bg-overlay/10">
              <EllipsisVertical class="size-5" />
            </button>
          </template>
          <template v-if="authStore.isGuest">
            <AppDropdownItem @click="navigateTo('/login')">Sign in</AppDropdownItem>
          </template>
          <template v-else>
            <div class="px-2.5 py-1.5 text-xs text-[var(--color-text-muted)]">{{ authStore.user?.email }}</div>
            <div v-if="isDayPassActive" class="px-2.5 pb-1.5 text-[10px] text-[var(--color-accent)]">
              Pass active until {{ formatPassExpiry(dayPassExpiresAt!) }}
            </div>
            <div v-else-if="authStore.isPro" class="px-2.5 pb-1.5 text-[10px] text-[var(--color-accent)]">
              Access active
            </div>
            <AppDropdownItem v-if="authStore.isPro" @click="openBilling">Manage subscription</AppDropdownItem>
            <AppDropdownItem @click="signOut">Sign out</AppDropdownItem>
          </template>
        </AppDropdown>
      </template>
    </header>

    <main class="flex-1 overflow-y-auto p-6">
      <div class="mx-auto max-w-4xl">
        <div class="mb-6 flex items-center justify-between">
          <h2 class="text-sm font-medium text-[var(--color-text)]">Your Projects</h2>
          <AppButton @click="onNewProject">
            <svg class="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New project
          </AppButton>
        </div>

        <Transition name="fade" mode="out-in">
          <!-- Skeleton cards while loading -->
          <div v-if="loading" key="skeleton" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div
              v-for="i in 3"
              :key="i"
              class="animate-pulse rounded-xl border-subtle bg-[var(--color-surface-3)] p-4"
            >
              <div class="mb-3 h-32 rounded-lg bg-overlay/5" />
              <div class="h-3 w-3/4 rounded bg-overlay/5" />
              <div class="mt-2 h-2.5 w-1/3 rounded bg-overlay/5" />
            </div>
          </div>

          <!-- Project grid -->
          <div v-else-if="projects.length > 0" key="projects" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div
              v-for="project in projects"
              :key="project.id"
              class="group relative cursor-pointer rounded-xl border-subtle bg-[var(--color-surface-3)] p-4 transition-all hover:[border-color:rgba(255,255,255,0.12)]"
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

              <input
                v-if="editingId === project.id"
                ref="renameInputEl"
                v-model="editingName"
                class="w-full truncate rounded bg-[var(--color-surface)] px-1 -mx-1 text-sm font-medium text-[var(--color-text)] outline-none ring-1 ring-[var(--color-accent)]"
                @click.stop
                @keydown.enter="commitRename(project.id)"
                @keydown.escape="cancelRename"
                @blur="commitRename(project.id)"
              />
              <p v-else class="truncate text-sm font-medium text-[var(--color-text)]">{{ project.name }}</p>
              <p class="mt-0.5 text-xs text-[var(--color-text-muted)]">
                {{ formatDate(project.updatedAt) }}
              </p>

              <!-- Desktop: hover-revealed actions -->
              <template v-if="!isMobile">
                <AppButton
                  variant="ghost"
                  size="sm"
                  icon-only
                  aria-label="Rename project"
                  class="absolute right-10 top-3 opacity-0 group-hover:opacity-100"
                  @click.stop="startRename(project)"
                >
                  <Pencil />
                </AppButton>
                <AppButton
                  variant="danger-ghost"
                  size="sm"
                  icon-only
                  aria-label="Delete project"
                  class="absolute right-3 top-3 opacity-0 group-hover:opacity-100"
                  @click.stop="confirmDelete(project.id, project.name)"
                >
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </AppButton>
              </template>

              <!-- Mobile: always-visible overflow menu -->
              <div v-else class="absolute right-2 top-2" @click.stop>
                <AppDropdown align="right">
                  <template #trigger>
                    <button class="flex size-7 items-center justify-center rounded-md bg-black/40 text-[var(--color-text-muted)] backdrop-blur-sm active:bg-black/60">
                      <EllipsisVertical class="size-4" />
                    </button>
                  </template>
                  <AppDropdownItem @click="startRename(project)">
                    <Pencil class="size-3.5" /> Rename
                  </AppDropdownItem>
                  <AppDropdownItem danger @click="confirmDelete(project.id, project.name)">
                    <Trash2 class="size-3.5" /> Delete
                  </AppDropdownItem>
                </AppDropdown>
              </div>
            </div>
          </div>

          <!-- Empty state -->
          <div v-else key="empty" class="flex flex-col items-center justify-center py-20 text-center">
            <svg class="mb-4 size-12 text-[var(--color-border)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 7.125C2.25 6.504 2.754 6 3.375 6h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 01-1.125-1.125v-3.75zm0 9.75c0-.621.504-1.125 1.125-1.125h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 01-1.125-1.125v-3.75zm9.75-9.75c0-.621.504-1.125 1.125-1.125h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 01-1.125-1.125v-3.75zm0 9.75c0-.621.504-1.125 1.125-1.125h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 01-1.125-1.125v-3.75z" />
            </svg>
            <p class="text-sm font-medium text-[var(--color-text)]">No projects yet</p>
            <AppButton variant="ghost" size="sm" class="mt-3" @click="onNewProject()">
              Create a new project to get started.
            </AppButton>
          </div>
        </Transition>
      </div>
    </main>

    <NewProjectModal
      :open="showNew"
      @close="showNew = false"
      @created="onProjectCreated"
      @composed="onProjectComposed"
    />

    <!-- Project limit modal -->
    <AppModal :open="showProUpsell" title="Project limit reached" @close="showProUpsell = false">
      <p class="text-sm text-[var(--color-text-muted)]">
        You're limited to <strong class="text-[var(--color-text)]">50 projects</strong>.
        Delete an existing project to create a new one.
      </p>
      <template #footer>
        <AppButton variant="ghost" @click="showProUpsell = false">
          Close
        </AppButton>
      </template>
    </AppModal>

    <!-- Delete confirm -->
    <AppModal :open="!!deleteTarget" title="Delete project?" @close="deleteTarget = null">
      <p class="text-sm text-[var(--color-text-muted)]">
        Delete <strong class="text-[var(--color-text)]">{{ deleteTarget?.name }}</strong>? This cannot be undone.
      </p>
      <template #footer>
        <AppButton variant="ghost" @click="deleteTarget = null">
          Cancel
        </AppButton>
        <AppButton variant="danger" @click="doDelete">
          Delete
        </AppButton>
      </template>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Projects — Snipfolio' })
import { Pencil, EllipsisVertical, Trash2 } from 'lucide-vue-next'
import { useAuthStore } from '~/stores/auth'
import { useProjectStore } from '~/stores/project'
import { useAuth } from '~/composables/useAuth'
import { useProject } from '~/composables/useProject'
import { usePlan, formatPassExpiry } from '~/composables/usePlan'

definePageMeta({ middleware: 'auth' })

const authStore = useAuthStore()
const projectStore = useProjectStore()
const { signOut: authSignOut } = useAuth()
const { fetchProjects, deleteProject, renameProject, loadPreview } = useProject()
const { canCreateProject, isDayPassActive, dayPassExpiresAt } = usePlan()
const isMobile = useIsMobile()

const config = useRuntimeConfig()
const billingUrl = config.public.lsStoreSlug
  ? `https://${config.public.lsStoreSlug}.lemonsqueezy.com/billing`
  : 'https://app.lemonsqueezy.com/my-orders'

const projects = computed(() => projectStore.projects)
const showNew = ref(false)
const openToUrl = ref(false)
const showProUpsell = ref(false)
const deleteTarget = ref<{ id: string; name: string } | null>(null)
const previews = ref<Record<string, string>>({})
const loading = ref(true)
const editingId = ref<string | null>(null)
const editingName = ref('')
const renameInputEl = ref<HTMLInputElement[]>([])

watch(projects, (list) => {
  for (const p of list) {
    if (previews.value[p.id]) continue
    loadPreview(p.id)
      .then((thumb) => {
        if (thumb) previews.value = { ...previews.value, [p.id]: thumb }
      })
      .catch(() => {})
  }
})

onMounted(async () => {
  if (useRoute().query.openUrlCapture === '1') {
    openToUrl.value = true
    showNew.value = true
    await navigateTo({ path: '/projects' }, { replace: true })
  }

  try {
    await fetchProjects()
  } catch (e) {
    console.error('[projects] failed to load projects:', e)
  } finally {
    loading.value = false
  }
})

function onNewProject() {
  if (!canCreateProject()) {
    showProUpsell.value = true
  } else {
    showNew.value = true
  }
}

async function onProjectCreated(projectId: string) {
  showNew.value = false
  await navigateTo(`/advanced/${projectId}`)
}

async function onProjectComposed(projectId: string, compositionId: string) {
  showNew.value = false
  await navigateTo(`/advanced/${projectId}/compose/${compositionId}`)
}

function openProject(id: string) {
  navigateTo(`/advanced/${id}`)
}

function confirmDelete(id: string, name: string) {
  deleteTarget.value = { id, name }
}

function startRename(project: { id: string; name: string }) {
  editingId.value = project.id
  editingName.value = project.name
  nextTick(() => {
    const input = renameInputEl.value[0]
    input?.focus()
    input?.select()
  })
}

async function commitRename(id: string) {
  if (editingId.value !== id) return
  editingId.value = null
  const project = projects.value.find((p) => p.id === id)
  const trimmed = editingName.value.trim()
  if (!project || trimmed === project.name) return
  await renameProject(id, trimmed)
}

function cancelRename() {
  editingId.value = null
}

async function doDelete() {
  if (!deleteTarget.value) return
  await deleteProject(deleteTarget.value.id)
  deleteTarget.value = null
}

function openBilling() {
  window.open(billingUrl, '_blank')
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
