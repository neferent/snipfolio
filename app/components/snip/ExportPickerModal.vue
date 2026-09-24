<template>
  <AppModal :open="open" title="Export mockups" max-width="780px" @close="$emit('close')">
    <div class="flex gap-4 min-h-[340px]">
      <!-- Left: composition list with checkboxes -->
      <div class="flex w-56 shrink-0 flex-col gap-1">
        <label class="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 transition hover:bg-overlay/5">
          <input
            type="checkbox"
            class="size-3.5 accent-[var(--color-accent)]"
            :checked="allSelected"
            :indeterminate="someSelected && !allSelected"
            @change="toggleAll"
          />
          <span class="text-sm font-medium text-[var(--color-text-muted)]">
            {{ allSelected ? 'Deselect all' : 'Select all' }}
          </span>
        </label>

        <div class="my-0.5 h-px bg-[var(--color-border)]" />

        <label
          v-for="comp in compositions"
          :key="comp.id"
          class="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 transition hover:bg-overlay/5"
          :class="previewComp?.id === comp.id ? 'bg-overlay/5' : ''"
          @mouseenter="previewComp = comp"
        >
          <input
            type="checkbox"
            class="size-3.5 shrink-0 accent-[var(--color-accent)]"
            :checked="selected.has(comp.id)"
            @change="toggleOne(comp.id)"
          />
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm text-[var(--color-text)]">{{ comp.name }}</p>
            <p class="text-[10px] text-[var(--color-text-muted)]">
              {{ comp.config.outputWidth }}×{{ comp.config.outputHeight }} · {{ comp.type }}
            </p>
          </div>
        </label>

        <div v-if="compositions.length === 0" class="px-2 py-4 text-center text-xs text-[var(--color-text-muted)]">
          No mockups yet
        </div>
      </div>

      <!-- Right: preview -->
      <div class="flex min-w-0 flex-1 flex-col rounded-lg bg-[var(--color-surface)] p-3">
        <template v-if="previewComp">
          <p class="mb-2 truncate text-sm font-medium text-[var(--color-text-muted)]">
            {{ previewComp.name }}
          </p>
          <div class="flex flex-1 items-center justify-center overflow-hidden">
            <CompositionPreview :composition="previewComp" class="max-h-full max-w-full rounded object-contain" />
          </div>
          <p class="mt-2 text-center text-[10px] text-[var(--color-text-muted)]">
            {{ previewComp.config.outputWidth }}×{{ previewComp.config.outputHeight }}px
          </p>
        </template>
        <div v-else class="flex flex-1 items-center justify-center">
          <p class="text-xs text-[var(--color-text-muted)]">Hover a mockup to preview</p>
        </div>
      </div>
    </div>

    <!-- Frame mismatch warning -->
    <div
      v-if="exportMismatches.length > 0"
      class="mt-4 rounded-lg px-4 py-3 bg-[rgba(251,191,36,0.05)] [border:0.5px_solid_rgba(251,191,36,0.25)]"
    >
      <p class="mb-[5px] text-[12px] font-semibold tracking-[0.04em] text-amber-400">Frame mismatch</p>
      <ul class="m-0 flex list-none flex-col gap-[3px] p-0">
        <li
          v-for="m in exportMismatches"
          :key="m.slotId"
          class="text-[12px] [color:rgba(251,191,36,0.7)]"
        >
          <span class="[color:rgba(251,191,36,0.4)]">{{ m.frameName }}</span>
          {{ m.snipLabel }}<span v-if="exportMismatches.length > 1 && m.compName" class="[color:rgba(251,191,36,0.35)]"> · {{ m.compName }}</span>
        </li>
      </ul>
      <p class="mt-[5px] text-[10px] [color:rgba(251,191,36,0.4)]">Frame will appear distorted</p>
    </div>

    <template #footer>
      <AppButton variant="ghost" @click="$emit('close')">
        Cancel
      </AppButton>
      <AppButton :disabled="selected.size === 0" @click="exportSelected">
        Export {{ selected.size > 0 ? selected.size : '' }} mockup{{ selected.size === 1 ? '' : 's' }}
      </AppButton>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { useCompositionsStore } from '~/stores/compositions'
import { useExport } from '~/composables/useExport'
import { useSnipsStore } from '~/stores/snips'
import { getFrameMismatches } from '~/composables/useFrameMismatches'
import type { Composition } from '~/types'

const props = defineProps<{
  open: boolean
  preselectId?: string
}>()
const emit = defineEmits<{ close: [] }>()

const compositionsStore = useCompositionsStore()
const snipsStore = useSnipsStore()
const { exportComposition } = useExport()

const compositions = computed(() => compositionsStore.ordered)

const selected = ref<Set<string>>(new Set())
const previewComp = ref<Composition | null>(null)

const allSelected = computed(() => compositions.value.length > 0 && selected.value.size === compositions.value.length)

const exportMismatches = computed(() =>
  compositions.value
    .filter((c) => selected.value.has(c.id))
    .flatMap((c) => getFrameMismatches(c, snipsStore.snips).map((m) => ({ ...m, compName: c.name }))),
)
const someSelected = computed(() => selected.value.size > 0)

watch(() => compositions.value, (list) => {
  if (!previewComp.value && list.length > 0) previewComp.value = list[0]!
}, { immediate: true })

// Auto-select preselectId when provided
watch([() => props.preselectId, () => compositions.value], ([id, list]) => {
  if (id && list.some((c) => c.id === id)) {
    selected.value = new Set([id])
    previewComp.value = list.find((c) => c.id === id) ?? previewComp.value
  }
}, { immediate: true })

// Prune deleted compositions from selection
watch(() => compositions.value, (list) => {
  const next = new Set<string>()
  for (const id of selected.value) {
    if (list.some((c) => c.id === id)) next.add(id)
  }
  selected.value = next
})

function toggleOne(id: string) {
  const next = new Set(selected.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selected.value = next
}

function toggleAll() {
  if (allSelected.value) {
    selected.value = new Set()
  } else {
    selected.value = new Set(compositions.value.map((c) => c.id))
  }
}

function exportSelected() {
  const toExport = compositions.value.filter((c) => selected.value.has(c.id))
  toExport.forEach((comp, i) => {
    setTimeout(() => exportComposition(comp, false), i * 200)
  })
  emit('close')
}
</script>
