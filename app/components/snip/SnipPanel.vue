<template>
  <aside class="flex w-64 flex-col border-l border-[var(--color-border)] bg-[var(--color-surface-2)]">
    <div class="border-b border-[var(--color-border)] px-4 py-3">
      <h2 class="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
        Snip Properties
      </h2>
    </div>

    <div v-if="snip" class="flex-1 overflow-y-auto p-4 space-y-5">
      <!-- Thumbnail preview -->
      <SnipThumbnail :snip="snip" preview />

      <!-- Label -->
      <div class="space-y-1.5">
        <label class="text-xs font-medium text-[var(--color-text-muted)]">Label</label>
        <input
          :value="snip.label"
          class="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-3)] px-3 py-1.5 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
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

      <!-- Device frame -->
      <div class="space-y-2">
        <label class="text-xs font-medium text-[var(--color-text-muted)]">Device Frame</label>
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="frame in frames"
            :key="frame.value"
            class="flex items-center justify-center gap-1.5 rounded-lg border py-2 text-xs transition"
            :class="
              snip.deviceFrame === frame.value
                ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/15 text-[var(--color-accent)]'
                : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-white/20 hover:text-[var(--color-text)]'
            "
            @click="updateFrame(frame.value)"
          >
            <span>{{ frame.icon }}</span>
            {{ frame.label }}
          </button>
        </div>
      </div>

      <!-- Actions -->
      <div class="pt-2 space-y-2">
        <button
          class="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-accent)] py-2 text-sm font-medium text-white transition hover:bg-[var(--color-accent-hover)]"
          @click="createCompositionFromSnip"
        >
          Create composition
        </button>
        <button
          class="flex w-full items-center justify-center gap-2 rounded-lg bg-transparent py-2 text-sm text-[var(--color-text-muted)] transition hover:bg-white/5 hover:text-[var(--color-danger)]"
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
import type { DeviceFrame } from '~/types'

const store = useSnipsStore()
const snipsActions = useSnips()
const compositionsActions = useCompositions()
const { exportSnipRaw } = useExport()
const router = useRouter()
const route = useRoute()

const snip = computed(() => store.selectedSnip)

const frames = [
  { value: 'none' as DeviceFrame, label: 'None', icon: '⬜' },
  { value: 'phone' as DeviceFrame, label: 'Phone', icon: '📱' },
  { value: 'browser' as DeviceFrame, label: 'Browser', icon: '🖥' },
  { value: 'laptop' as DeviceFrame, label: 'Laptop', icon: '💻' },
]

function updateLabel(label: string) {
  if (snip.value) snipsActions.updateLabel(snip.value.id, label)
}

function updateFrame(frame: DeviceFrame) {
  if (snip.value) snipsActions.updateFrame(snip.value.id, frame)
}

function createCompositionFromSnip() {
  if (!snip.value) return
  const comp = compositionsActions.createSingleComposition(snip.value.id)
  router.push(`/project/${route.params.id}/compose/${comp.id}`)
}

function exportRaw() {
  if (snip.value) exportSnipRaw(snip.value)
}
</script>
