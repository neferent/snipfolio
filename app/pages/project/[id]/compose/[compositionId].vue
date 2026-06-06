<template>
  <div class="flex flex-1 flex-col overflow-hidden">
    <!-- Top toolbar -->
    <header class="flex h-12 shrink-0 items-center gap-2 px-4" style="background:#16191d;border-bottom:0.5px solid rgba(255,255,255,0.06)">
      <NuxtLink
        :to="`/project/${projectId}`"
        class="flex items-center gap-1.5 transition"
        style="font-size:13px;color:#6b7280"
        @mouseenter="($event.currentTarget as HTMLElement).style.color='#e2e6ea'"
        @mouseleave="($event.currentTarget as HTMLElement).style.color='#6b7280'"
      >
        <svg class="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Projects
      </NuxtLink>
      <span style="color:#4a5e6e;font-size:13px"> / </span>
      <span class="font-medium text-[var(--color-text)]" style="font-size:13px">
        {{ composition?.name ?? 'Composition' }}
      </span>
      <div class="flex-1" />
      <SaveStatus :status="projectStore.saveStatus" />
    </header>

    <div class="relative min-h-0 flex-1">
      <Transition name="fade">
        <CompositionEditor v-if="composition" :composition-id="compositionId" />
        <div v-else-if="!loading" class="flex h-full items-center justify-center text-sm text-[var(--color-text-muted)]">
          Composition not found
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
const { loadProject } = useProject()

const projectId = computed(() => route.params.id as string)
const compositionId = computed(() => route.params.compositionId as string)
const composition = computed(() =>
  compositionsStore.compositions.find((c) => c.id === compositionId.value),
)
const loading = ref(true)

onMounted(async () => {
  if (!projectStore.current) {
    await loadProject(projectId.value)
  }
  loading.value = false
})
</script>
