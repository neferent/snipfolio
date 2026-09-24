<template>
  <div class="flex flex-1 flex-col overflow-hidden">
    <div class="h-1 shrink-0 bg-[#38bdf8]" />
    <!-- Top toolbar -->
    <header class="flex h-12 shrink-0 items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface-2)] px-4">
      <AppLogo />
      <div class="h-4 w-px shrink-0 bg-[var(--color-border)]" />
      <NuxtLink
        to="/projects"
        class="shrink-0 text-sm text-[var(--color-text-muted)] transition hover:text-[var(--color-text)]"
      >
        ← Projects
      </NuxtLink>

      <span class="shrink-0 text-sm text-[var(--color-text-faint)]">/</span>

      <!-- Editable project name -->
      <div class="group relative flex items-center">
        <input
          :value="projectStore.current?.name ?? ''"
          class="appearance-none truncate rounded bg-transparent pr-6 text-sm font-medium text-[var(--color-text)] outline-none transition hover:bg-[var(--color-surface-3)] focus:bg-[var(--color-surface-3)] placeholder:text-[var(--color-text-muted)]"
          placeholder="Untitled project"
          @input="debouncedRename(($event.target as HTMLInputElement).value)"
        />
        <Pencil class="pointer-events-none absolute right-2 size-3 text-[var(--color-text-muted)] opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100" />
      </div>

      <div class="flex-1" />

      <SaveStatus :status="projectStore.saveStatus" />
      <ThemeToggle />
    </header>

    <!-- relative + flex-1 gives SnipTool's absolute inset-0 a defined bounding box -->
    <div class="relative min-h-0 flex-1">
      <Transition name="fade">
        <SnipTool v-if="!loading && !loadError" />
        <div
          v-else-if="loadError"
          class="flex h-full flex-col items-center justify-center gap-3 text-center"
        >
          <p class="text-sm text-[var(--color-text-muted)]">Failed to load project.</p>
          <NuxtLink
            to="/projects"
            class="text-sm text-[var(--color-accent)] hover:underline"
          >
            ← Back to Projects
          </NuxtLink>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Pencil } from 'lucide-vue-next'
import { useProjectStore } from '~/stores/project'
import { useProject } from '~/composables/useProject'


const route = useRoute()
const projectStore = useProjectStore()

useHead({ title: computed(() => projectStore.current ? `${projectStore.current.name} — Snipfolio` : 'Snipfolio') })
const { loadProject, scheduleSave, fetchProjects } = useProject()

const projectId = computed(() => route.params.id as string)
const loading = ref(true)
const loadError = ref(false)

onMounted(async () => {
  try {
    await Promise.all([
      loadProject(projectId.value),
      projectStore.projects.length ? Promise.resolve() : fetchProjects(),
    ])
  } catch (e) {
    console.error('[project] failed to load:', e)
    loadError.value = true
  } finally {
    loading.value = false
  }
})

let renameTimer: ReturnType<typeof setTimeout> | null = null
function debouncedRename(name: string) {
  if (projectStore.current) {
    projectStore.current.name = name
  }
  if (renameTimer) clearTimeout(renameTimer)
  renameTimer = setTimeout(() => scheduleSave(), 800)
}
</script>
