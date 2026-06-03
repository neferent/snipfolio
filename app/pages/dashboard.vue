<template>
  <div class="flex flex-1 flex-col overflow-hidden bg-[var(--color-surface)]">
    <!-- Header -->
    <header class="flex items-center gap-4 border-b border-[var(--color-border)] px-6 py-4">
      <h1 class="text-lg font-bold text-[var(--color-text)]">Snipfolio</h1>
      <div class="flex-1" />
      <span class="text-xs text-[var(--color-text-muted)]">{{ authStore.user?.email }}</span>
      <button
        class="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-text-muted)] transition hover:border-white/20 hover:text-[var(--color-text)]"
        @click="signOut"
      >
        Sign out
      </button>
    </header>

    <main class="flex-1 overflow-y-auto p-6">
      <div class="mx-auto max-w-4xl">
        <div class="mb-6 flex items-center justify-between">
          <h2 class="text-sm font-semibold text-[var(--color-text)]">Your Projects</h2>
          <button
            class="flex items-center gap-1.5 rounded-lg bg-[var(--color-accent)] px-3 py-1.5 text-sm font-medium text-white transition hover:bg-[var(--color-accent-hover)]"
            @click="showNew = true"
          >
            <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New project
          </button>
        </div>

        <!-- Project grid -->
        <div v-if="projects.length > 0" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="project in projects"
            :key="project.id"
            class="group relative cursor-pointer rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 transition-colors hover:border-white/20"
            @click="openProject(project.id)"
          >
            <!-- Placeholder thumbnail -->
            <div class="mb-3 flex h-32 items-center justify-center rounded-lg bg-[var(--color-surface-3)]">
              <svg class="size-8 text-[var(--color-border)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M13.5 12h.008v.008H13.5V12z" />
              </svg>
            </div>

            <p class="truncate text-sm font-medium text-[var(--color-text)]">{{ project.name }}</p>
            <p class="mt-0.5 text-xs text-[var(--color-text-muted)]">
              {{ formatDate(project.updatedAt) }}
            </p>

            <!-- Delete button -->
            <button
              class="absolute right-3 top-3 rounded p-1 opacity-0 text-[var(--color-text-muted)] transition group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-400"
              @click.stop="confirmDelete(project.id, project.name)"
            >
              <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        <div v-else class="flex flex-col items-center justify-center py-20 text-center">
          <svg class="mb-4 size-12 text-[var(--color-border)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 7.125C2.25 6.504 2.754 6 3.375 6h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 01-1.125-1.125v-3.75zm0 9.75c0-.621.504-1.125 1.125-1.125h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 01-1.125-1.125v-3.75zm9.75-9.75c0-.621.504-1.125 1.125-1.125h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 01-1.125-1.125v-3.75zm0 9.75c0-.621.504-1.125 1.125-1.125h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 01-1.125-1.125v-3.75z" />
          </svg>
          <p class="text-sm font-medium text-[var(--color-text)]">No projects yet</p>
          <p class="mt-1 text-xs text-[var(--color-text-muted)]">Create your first project to get started</p>
        </div>
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
            class="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-3)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
            placeholder="My portfolio project"
            @keydown.enter="createProject"
          />
        </div>
      </div>
      <template #footer>
        <button
          class="rounded-lg px-3 py-1.5 text-sm text-[var(--color-text-muted)] transition hover:bg-white/10"
          @click="showNew = false"
        >
          Cancel
        </button>
        <button
          class="rounded-lg bg-[var(--color-accent)] px-4 py-1.5 text-sm font-medium text-white transition hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
          :disabled="!newName.trim()"
          @click="createProject"
        >
          Create
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
          class="rounded-lg px-3 py-1.5 text-sm text-[var(--color-text-muted)] transition hover:bg-white/10"
          @click="deleteTarget = null"
        >
          Cancel
        </button>
        <button
          class="rounded-lg bg-red-500 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-red-600"
          @click="doDelete"
        >
          Delete
        </button>
      </template>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { useProjectStore } from '~/stores/project'
import { useAuth } from '~/composables/useAuth'
import { useProject } from '~/composables/useProject'

definePageMeta({ middleware: 'auth' })

const authStore = useAuthStore()
const projectStore = useProjectStore()
const { signOut: authSignOut } = useAuth()
const { fetchProjects, createProject: createProjectFn, deleteProject } = useProject()

const projects = computed(() => projectStore.projects)
const showNew = ref(false)
const newName = ref('')
const nameInput = ref<HTMLInputElement>()
const deleteTarget = ref<{ id: string; name: string } | null>(null)

watch(showNew, (v) => {
  if (v) nextTick(() => nameInput.value?.focus())
})

onMounted(() => fetchProjects())

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
