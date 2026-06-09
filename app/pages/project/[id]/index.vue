<template>
  <div class="flex flex-1 flex-col overflow-hidden">
    <!-- Top toolbar -->
    <header class="flex items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-2">
      <NuxtLink
        to="/dashboard"
        class="shrink-0 text-sm text-[var(--color-text-muted)] transition hover:text-[var(--color-text)]"
      >
        ← Dashboard
      </NuxtLink>

      <div class="mx-2 h-4 w-px bg-[var(--color-border)]" />

      <!-- Editable project name -->
      <input
        :value="projectStore.current?.name ?? ''"
        class="flex-1 bg-transparent text-sm font-medium text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)]"
        placeholder="Untitled project"
        @input="debouncedRename(($event.target as HTMLInputElement).value)"
      />

      <SaveStatus :status="projectStore.saveStatus" />
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
            to="/dashboard"
            class="text-sm text-[var(--color-accent)] hover:underline"
          >
            ← Back to Dashboard
          </NuxtLink>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useProjectStore } from '~/stores/project'
import { useProject } from '~/composables/useProject'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const projectStore = useProjectStore()

useHead({ title: computed(() => projectStore.current ? `${projectStore.current.name} — Snipfolio` : 'Snipfolio') })
const { loadProject, scheduleSave } = useProject()

const projectId = computed(() => route.params.id as string)
const loading = ref(true)
const loadError = ref(false)

onMounted(async () => {
  try {
    await loadProject(projectId.value)
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
