<template>
  <aside class="flex w-64 flex-col border-l border-[var(--color-border)] bg-[var(--color-surface-2)]">
    <div class="px-4 py-3" style="border-bottom:0.5px solid rgba(255,255,255,0.06)">
      <h2 style="font-size:11px;font-weight:500;letter-spacing:0.07em;text-transform:uppercase;color:#4a5e6e">
        Snip Properties
      </h2>
    </div>

    <div v-if="snip" class="flex-1 overflow-y-auto p-4 space-y-5">
      <!-- Thumbnail preview -->
      <SnipThumbnail :snip="snip" preview />

      <!-- Label -->
      <div class="space-y-1.5">
        <label for="snip-label" class="text-xs text-[var(--color-text-muted)]">Label</label>
        <input
          id="snip-label"
          :value="snip.label"
          class="w-full"
          @input="updateLabel(($event.target as HTMLInputElement).value)"
        />
      </div>

      <!-- Dimensions (read-only) -->
      <div class="grid grid-cols-2 gap-2">
        <div class="space-y-1">
          <label class="text-xs text-[var(--color-text-muted)]">Width</label>
          <div class="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-3)] px-3 py-1.5 text-sm text-[var(--color-text-muted)]">
            {{ snip.width }}px
          </div>
        </div>
        <div class="space-y-1">
          <label class="text-xs text-[var(--color-text-muted)]">Height</label>
          <div class="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-3)] px-3 py-1.5 text-sm text-[var(--color-text-muted)]">
            {{ snip.height }}px
          </div>
        </div>
      </div>

      <!-- Position (read-only) -->
      <div class="grid grid-cols-2 gap-2">
        <div class="space-y-1">
          <label class="text-xs text-[var(--color-text-muted)]">X</label>
          <div class="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-3)] px-3 py-1.5 text-sm text-[var(--color-text-muted)]">
            {{ snip.x }}
          </div>
        </div>
        <div class="space-y-1">
          <label class="text-xs text-[var(--color-text-muted)]">Y</label>
          <div class="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-3)] px-3 py-1.5 text-sm text-[var(--color-text-muted)]">
            {{ snip.y }}
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="pt-2 space-y-2">
        <button
          class="flex h-8 w-full items-center justify-center gap-2 rounded-[6px] bg-[var(--color-accent)] text-sm font-medium transition hover:bg-[var(--color-accent-hover)] hover:text-[var(--color-text)]"
          style="color:#111316"
          @click="createCompositionFromSnip"
        >
          Create composition
        </button>
        <button
          class="flex h-8 w-full items-center justify-center gap-2 rounded-[6px] bg-transparent text-sm text-[var(--color-text-muted)] transition hover:bg-white/5 hover:text-[var(--color-danger)]"
          @click="exportRaw"
        >
          Export raw PNG
        </button>
      </div>
    </div>

    <div v-else class="flex flex-1 items-center justify-center p-4">
      <p class="text-center text-xs text-[var(--color-text-muted)]">
        Select a snip to edit its properties
      </p>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useSnipsStore } from '~/stores/snips'
import { useSnips } from '~/composables/useSnips'
import { useCompositions } from '~/composables/useCompositions'
import { useExport } from '~/composables/useExport'

const store = useSnipsStore()
const snipsActions = useSnips()
const compositionsActions = useCompositions()
const { exportSnipRaw } = useExport()
const router = useRouter()
const route = useRoute()

const snip = computed(() => store.selectedSnip)

function updateLabel(label: string) {
  if (snip.value) snipsActions.updateLabel(snip.value.id, label)
}

function createCompositionFromSnip() {
  if (!snip.value) return
  const comp = compositionsActions.createLaptopComposition(snip.value.id)
  router.push(`/project/${route.params.id}/compose/${comp.id}`)
}

function exportRaw() {
  if (snip.value) exportSnipRaw(snip.value)
}
</script>
