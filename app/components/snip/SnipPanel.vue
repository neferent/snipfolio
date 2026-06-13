<template>
  <aside
    class="relative flex shrink-0 flex-col border-l border-[var(--color-border)] bg-[var(--color-surface-2)]"
    :style="{ width: width + 'px' }"
  >
    <div class="flex h-10 shrink-0 items-center px-4 border-b-subtle">
      <h2 class="text-[12px] font-medium tracking-wider uppercase text-[var(--color-text-faint)]">
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
          class="flex h-8 w-full items-center justify-center gap-2 rounded-[6px] border-strong text-sm text-[var(--color-text)] transition hover:bg-white/5"
          @click="exportRaw"
        >
          Export raw PNG
        </button>
        <button
          class="flex h-8 w-full items-center justify-center gap-2 rounded-[6px] border-strong text-sm text-[var(--color-text)] transition hover:bg-white/5"
          @click="copyToClipboard"
        >
          <Check v-if="copied" class="size-3.5" />
          <Copy v-else class="size-3.5" />
          {{ copied ? 'Copied!' : 'Copy to clipboard' }}
        </button>
      </div>
    </div>

    <div v-else class="flex flex-1 items-center justify-center p-4">
      <p class="text-center text-xs text-[var(--color-text-muted)]">
        Select a snip to edit its properties
      </p>
    </div>

    <!-- Drag handle -->
    <div
      class="absolute inset-y-0 left-0 z-10 w-1 cursor-col-resize hover:bg-[var(--color-accent)]/40 transition-colors"
      @mousedown="startResize"
    />
  </aside>
</template>

<script setup lang="ts">
import { Check, Copy } from 'lucide-vue-next'
import { useSnipsStore } from '~/stores/snips'
import { useResizablePanel } from '~/composables/useResizablePanel'

const { width, startResize } = useResizablePanel(256, { side: 'left', min: 180, max: 480 })
import { useSnips } from '~/composables/useSnips'
import { useExport } from '~/composables/useExport'

const store = useSnipsStore()
const snipsActions = useSnips()
const { exportSnipRaw, copySnipToClipboard } = useExport()

const snip = computed(() => store.selectedSnip)
const copied = ref(false)

function updateLabel(label: string) {
  if (snip.value) snipsActions.updateLabel(snip.value.id, label)
}

function exportRaw() {
  if (snip.value) exportSnipRaw(snip.value)
}

async function copyToClipboard() {
  if (!snip.value) return
  const ok = await copySnipToClipboard(snip.value)
  if (ok) {
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }
}
</script>
