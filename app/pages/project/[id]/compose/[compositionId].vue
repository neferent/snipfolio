<template>
  <div class="flex flex-1 flex-col overflow-hidden">
    <div class="h-1 shrink-0 bg-[#a78bfa]" />
    <!-- Top toolbar -->
    <header class="flex h-12 shrink-0 items-center gap-2 border-b-subtle bg-[var(--color-surface-2)] px-4">
      <NuxtLink
        :to="`/project/${projectId}`"
        class="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] transition hover:text-[var(--color-text)]"
      >
        <svg class="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Snips
      </NuxtLink>
      <span class="text-xs text-[var(--color-text-faint)]"> / </span>
      <span class="text-xs font-medium text-[var(--color-text)]">
        {{ composition?.name ?? 'Composition' }}
      </span>
      <span class="rounded-full bg-[#a78bfa]/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#a78bfa]">
        Compose
      </span>
      <div class="flex-1" />
      <SaveStatus :status="projectStore.saveStatus" />
    </header>

    <div class="relative min-h-0 flex-1">
      <Transition name="fade">
        <CompositionEditor v-if="composition" :composition-id="compositionId" />
        <div v-else-if="!loading" class="flex h-full flex-col items-center justify-center gap-3 text-center">
          <p class="text-sm text-[var(--color-text-muted)]">
            {{ loadError ? 'Failed to load project.' : 'Composition not found.' }}
          </p>
          <NuxtLink
            :to="`/project/${projectId}`"
            class="text-xs text-[var(--color-accent)] hover:underline"
          >
            ← Back to project
          </NuxtLink>
        </div>
      </Transition>
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

useHead({ title: computed(() => projectStore.current ? `Compose — ${projectStore.current.name} — Snipfolio` : 'Snipfolio') })
const { loadProject } = useProject()

const projectId = computed(() => route.params.id as string)
const compositionId = computed(() => route.params.compositionId as string)
const composition = computed(() =>
  compositionsStore.compositions.find((c) => c.id === compositionId.value),
)
const loading = ref(true)
const loadError = ref(false)

onMounted(async () => {
  try {
    if (!projectStore.current) {
      await loadProject(projectId.value)
    }
  } catch (e) {
    console.error('[compose] failed to load:', e)
    loadError.value = true
  } finally {
    loading.value = false
  }
})
</script>
