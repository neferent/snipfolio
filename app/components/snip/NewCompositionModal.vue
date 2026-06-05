<template>
  <AppModal :open="open" title="New Composition" max-width="760px" @close="$emit('close')">
    <div class="flex gap-5">
      <!-- Left: form controls -->
      <div class="w-60 shrink-0 space-y-4">
        <div class="space-y-1.5">
          <label class="text-xs font-medium text-[var(--color-text-muted)]">Name</label>
          <input
            v-model="name"
            class="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-3)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
            placeholder="My composition"
          />
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-medium text-[var(--color-text-muted)]">Background</label>
          <div class="flex items-center gap-2">
            <input
              v-model="backgroundColor"
              type="color"
              class="h-8 w-10 cursor-pointer rounded border border-[var(--color-border)] bg-transparent p-0.5"
            />
            <span class="font-mono text-xs text-[var(--color-text-muted)]">{{ backgroundColor }}</span>
          </div>
        </div>

        <div class="space-y-2">
          <label class="text-xs font-medium text-[var(--color-text-muted)]">Type</label>
          <div class="grid grid-cols-2 gap-2">
            <button
              class="rounded-lg border p-3 text-sm transition"
              :class="
                type === 'single'
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/15 text-[var(--color-accent)]'
                  : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-white/20'
              "
              @click="type = 'single'"
            >
              <div class="text-lg">🖼</div>
              <div class="mt-1 font-medium">Single</div>
              <div class="text-[10px] opacity-70">One snip, styled</div>
            </button>
            <button
              class="rounded-lg border p-3 text-sm transition"
              :class="
                type === 'collage'
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/15 text-[var(--color-accent)]'
                  : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-white/20'
              "
              @click="type = 'collage'"
            >
              <div class="text-lg">⊞</div>
              <div class="mt-1 font-medium">Auto-Collage</div>
              <div class="text-[10px] opacity-70">No frames · may clip</div>
            </button>
          </div>
        </div>

        <!-- Snip selector -->
        <div class="space-y-2">
          <label class="text-xs font-medium text-[var(--color-text-muted)]">
            {{ type === 'single' ? 'Select snip' : `Select snips${selectedIds.length > 0 ? ` (${selectedIds.length})` : ''}` }}
          </label>
          <div class="max-h-48 overflow-y-auto space-y-1 rounded-lg border border-[var(--color-border)] p-1">
            <label
              v-for="snip in snips"
              :key="snip.id"
              class="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition hover:bg-white/5"
            >
              <input
                v-if="type === 'collage'"
                type="checkbox"
                :value="snip.id"
                v-model="selectedIds"
                class="accent-[var(--color-accent)]"
              />
              <input
                v-else
                type="radio"
                :value="snip.id"
                v-model="singleId"
                class="accent-[var(--color-accent)]"
              />
              <SnipThumbnail :snip="snip" class="size-7 rounded" />
              <span class="flex-1 truncate text-[var(--color-text)]">{{ snip.label }}</span>
            </label>
            <p v-if="snips.length === 0" class="px-2 py-2 text-xs text-[var(--color-text-muted)]">
              No snips yet — draw some first
            </p>
          </div>
        </div>
      </div>

      <!-- Right: live preview -->
      <div class="flex min-w-0 flex-1 flex-col gap-1.5">
        <label class="text-xs font-medium text-[var(--color-text-muted)]">Preview</label>
        <div class="flex-1 overflow-hidden rounded-lg border border-[var(--color-border)]" style="min-height: 260px">
          <CompositionCanvas v-if="previewComposition" :composition="previewComposition" />
          <div v-else class="flex h-full items-center justify-center text-xs text-[var(--color-text-muted)]">
            {{ type === 'single' ? 'Select a snip to preview' : 'Select 2+ snips to preview auto-collage' }}
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <button
        class="rounded-lg px-3 py-1.5 text-sm text-[var(--color-text-muted)] transition hover:bg-white/10"
        @click="$emit('close')"
      >
        Cancel
      </button>
      <button
        class="rounded-lg bg-[var(--color-accent)] px-4 py-1.5 text-sm font-medium text-white transition hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
        :disabled="!canCreate"
        @click="create"
      >
        Create
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { useSnipsStore } from '~/stores/snips'
import { useProjectStore } from '~/stores/project'
import { useCompositionsStore } from '~/stores/compositions'
import { useCompositions } from '~/composables/useCompositions'
import type { Composition, SingleCompositionConfig, CollageCompositionConfig } from '~/types'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const snipsStore = useSnipsStore()
const projectStore = useProjectStore()
const { createSingleComposition, createCollageComposition } = useCompositions()
const compositionsStore = useCompositionsStore()
const router = useRouter()
const route = useRoute()

const name = ref('')
const type = ref<'single' | 'collage'>('single')
const singleId = ref<string>('')
const selectedIds = ref<string[]>([])
const backgroundColor = ref('#1a1a2e')
const snips = computed(() => snipsStore.orderedSnips)

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      const projectName = projectStore.current?.name ?? 'Project'
      const n = compositionsStore.compositions.length + 1
      name.value = `${projectName} - Composition ${n}`
      backgroundColor.value = '#1a1a2e'
      type.value = 'single'
      singleId.value = ''
      selectedIds.value = []
    }
  },
)

const DEFAULT_BACKGROUND = computed(() => ({
  type: 'solid' as const,
  color: backgroundColor.value,
  gradientStart: backgroundColor.value,
  gradientEnd: '#16213e',
  gradientAngle: 135,
}))

const previewComposition = computed<Composition | null>(() => {
  const projectId = projectStore.current?.id ?? ''
  if (type.value === 'single') {
    if (!singleId.value) return null
    const snip = snipsStore.snips.find((s) => s.id === singleId.value)
    const config: SingleCompositionConfig = {
      snipId: singleId.value,
      deviceFrame: snip?.deviceFrame ?? 'none',
      background: { ...DEFAULT_BACKGROUND.value },
      scale: 0.8,
      offsetX: 0,
      offsetY: 0,
      outputWidth: 1920,
      outputHeight: 1080,
    }
    return { id: '__preview__', projectId, name: 'Preview', type: 'single', sortOrder: 0, config }
  } else {
    if (selectedIds.value.length < 2) return null
    const config: CollageCompositionConfig = {
      slots: selectedIds.value.map((snipId) => {
        const snip = snipsStore.snips.find((s) => s.id === snipId)
        return { snipId, deviceFrame: snip?.deviceFrame ?? 'none' }
      }),
      template: 'auto',
      gap: 24,
      background: { ...DEFAULT_BACKGROUND.value },
      outputWidth: 1920,
      outputHeight: 1080,
    }
    return { id: '__preview__', projectId, name: 'Preview', type: 'collage', sortOrder: 0, config }
  }
})

const canCreate = computed(() => {
  if (type.value === 'single') return !!singleId.value
  return selectedIds.value.length >= 2
})

function create() {
  if (!canCreate.value) return
  const bg = { ...DEFAULT_BACKGROUND.value }
  let comp
  if (type.value === 'single') {
    comp = createSingleComposition(singleId.value, name.value || undefined, bg)
  } else {
    comp = createCollageComposition(selectedIds.value, name.value || undefined, bg)
  }
  emit('close')
  router.push(`/project/${route.params.id}/compose/${comp.id}`)
}
</script>
