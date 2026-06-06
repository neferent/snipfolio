<template>
  <AppModal :open="open" title="Export compositions" max-width="780px" @close="$emit('close')">
    <div class="flex gap-4" style="min-height: 340px">
      <!-- Left: composition list with checkboxes -->
      <div class="flex w-56 shrink-0 flex-col gap-1">
        <!-- Select all toggle -->
        <label class="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 transition hover:bg-white/5">
          <input
            type="checkbox"
            class="size-3.5 accent-[var(--color-accent)]"
            :checked="allSelected"
            :indeterminate="someSelected && !allSelected"
            @change="toggleAll"
          />
          <span class="text-xs font-medium text-[var(--color-text-muted)]">
            {{ allSelected ? 'Deselect all' : 'Select all' }}
          </span>
        </label>

        <div class="my-0.5 h-px bg-[var(--color-border)]" />

        <label
          v-for="comp in compositions"
          :key="comp.id"
          class="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 transition hover:bg-white/5"
          :class="previewComp?.id === comp.id ? 'bg-white/5' : ''"
          @mouseenter="previewComp = comp"
        >
          <input
            type="checkbox"
            class="size-3.5 shrink-0 accent-[var(--color-accent)]"
            :checked="selected.has(comp.id)"
            @change="toggleOne(comp.id)"
          />
          <div class="min-w-0 flex-1">
            <p class="truncate text-xs text-[var(--color-text)]">{{ comp.name }}</p>
            <p class="text-[10px] text-[var(--color-text-muted)]">
              {{ comp.config.outputWidth }}×{{ comp.config.outputHeight }} · {{ comp.type }}
            </p>
          </div>
        </label>

        <div v-if="compositions.length === 0" class="px-2 py-4 text-center text-xs text-[var(--color-text-muted)]">
          No compositions yet
        </div>
      </div>

      <!-- Right: preview -->
      <div class="flex min-w-0 flex-1 flex-col rounded-lg bg-[var(--color-surface)] p-3">
        <template v-if="previewComp">
          <p class="mb-2 truncate text-xs font-medium text-[var(--color-text-muted)]">
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
          <p class="text-xs text-[var(--color-text-muted)]">Hover a composition to preview</p>
        </div>
      </div>
    </div>

    <template #footer>
      <button
        v-if="authStore.isGuest"
        class="mr-auto flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] opacity-50 transition hover:opacity-80"
        @click="signOut"
      >
        <Sparkles class="size-3 shrink-0" />
        Sign in to export without watermarks
      </button>
      <button
        class="flex h-8 items-center rounded-[6px] px-4 text-sm text-[var(--color-text-muted)] transition hover:bg-white/5"
        @click="$emit('close')"
      >
        Cancel
      </button>
      <button
        class="flex h-8 items-center rounded-[6px] bg-[var(--color-accent)] px-4 text-sm font-medium transition hover:bg-[var(--color-accent-hover)] hover:text-[var(--color-text)] disabled:opacity-40"
        style="color:#111316"
        :disabled="selected.size === 0"
        @click="exportSelected"
      >
        Export {{ selected.size > 0 ? selected.size : '' }} composition{{ selected.size === 1 ? '' : 's' }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { Sparkles } from 'lucide-vue-next'
import { useCompositionsStore } from '~/stores/compositions'
import { useAuthStore } from '~/stores/auth'
import { useAuth } from '~/composables/useAuth'
import { useExport } from '~/composables/useExport'
import type { Composition } from '~/types'

defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const compositionsStore = useCompositionsStore()
const authStore = useAuthStore()
const { signOut } = useAuth()
const { exportComposition } = useExport()

const compositions = computed(() => compositionsStore.ordered)

const selected = ref<Set<string>>(new Set())
const previewComp = ref<Composition | null>(null)

const allSelected = computed(() => compositions.value.length > 0 && selected.value.size === compositions.value.length)
const someSelected = computed(() => selected.value.size > 0)

watch(() => compositions.value, (list) => {
  if (!previewComp.value && list.length > 0) previewComp.value = list[0]!
}, { immediate: true })

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
    setTimeout(() => exportComposition(comp), i * 200)
  })
  emit('close')
}
</script>
