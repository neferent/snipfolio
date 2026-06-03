<template>
  <div class="flex flex-1 flex-col overflow-hidden">
    <!-- Top toolbar -->
    <header class="flex items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-2">
      <NuxtLink
        :to="`/project/${projectId}`"
        class="text-xs text-[var(--color-text-muted)] transition hover:text-[var(--color-text)]"
      >
        ← Editor
      </NuxtLink>
      <div class="mx-2 h-4 w-px bg-[var(--color-border)]" />
      <span class="text-sm font-medium text-[var(--color-text)]">
        {{ composition?.name ?? 'Composition' }}
      </span>
      <div class="flex-1" />
      <SaveStatus :status="projectStore.saveStatus" />
    </header>

    <div class="relative min-h-0 flex-1">
      <CompositionEditor v-if="composition" :composition-id="compositionId" />
      <div v-else class="flex h-full items-center justify-center text-sm text-[var(--color-text-muted)]">
        Composition not found
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCompositionsStore } from '~/stores/compositions'
import { useProjectStore } from '~/stores/project'
import { useProject } from '~/composables/useProject'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const compositionsStore = useCompositionsStore()
const projectStore = useProjectStore()
const { loadProject } = useProject()

const projectId = computed(() => route.params.id as string)
const compositionId = computed(() => route.params.compositionId as string)
const composition = computed(() =>
  compositionsStore.compositions.find((c) => c.id === compositionId.value),
)

onMounted(async () => {
  if (!projectStore.current) {
    await loadProject(projectId.value)
  }
})
</script>
