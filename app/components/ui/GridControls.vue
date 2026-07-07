<template>
  <div class="flex items-center gap-px">
    <AppTooltip text="Show grid">
      <button
        class="flex size-7 items-center justify-center rounded transition-colors"
        :class="gridSettings.showGrid
          ? 'bg-[var(--color-accent)]/15 text-[var(--color-accent)]'
          : 'text-[var(--color-text-muted)] hover:bg-overlay/10 hover:text-[var(--color-text)]'"
        aria-label="Toggle grid"
        :aria-pressed="gridSettings.showGrid"
        @click="gridSettings.showGrid = !gridSettings.showGrid"
      >
        <Grid3x3 class="size-3.5" aria-hidden="true" />
      </button>
    </AppTooltip>
    <AppTooltip text="Snap to grid">
      <button
        class="flex size-7 items-center justify-center rounded transition-colors"
        :class="gridSettings.snapEnabled
          ? 'bg-[var(--color-accent)]/15 text-[var(--color-accent)]'
          : 'text-[var(--color-text-muted)] hover:bg-overlay/10 hover:text-[var(--color-text)]'"
        aria-label="Toggle snap to grid"
        :aria-pressed="gridSettings.snapEnabled"
        @click="gridSettings.snapEnabled = !gridSettings.snapEnabled"
      >
        <Magnet class="size-3.5" aria-hidden="true" />
      </button>
    </AppTooltip>
    <AppTooltip text="Snap to objects">
      <button
        class="flex size-7 items-center justify-center rounded transition-colors"
        :class="gridSettings.snapToObjects
          ? 'bg-[var(--color-accent)]/15 text-[var(--color-accent)]'
          : 'text-[var(--color-text-muted)] hover:bg-overlay/10 hover:text-[var(--color-text)]'"
        aria-label="Toggle snap to objects"
        :aria-pressed="gridSettings.snapToObjects"
        @click="gridSettings.snapToObjects = !gridSettings.snapToObjects"
      >
        <Crosshair class="size-3.5" aria-hidden="true" />
      </button>
    </AppTooltip>
    <input
      v-if="gridSettings.showGrid || gridSettings.snapEnabled"
      class="!h-7 w-14 rounded bg-[var(--color-surface-3)] px-1 py-0.5 text-center font-mono text-xs text-[var(--color-text)] outline-none ring-inset focus:ring-1 focus:ring-[var(--color-accent)] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      aria-label="Grid size in pixels"
      title="Grid size (px)"
      type="number"
      min="2"
      max="500"
      :value="gridSettings.gridSize"
      @change="onSizeChange"
    />
  </div>
</template>

<script setup lang="ts">
import { Grid3x3, Magnet, Crosshair } from 'lucide-vue-next'
import { useGridSettingsStore } from '~/stores/gridSettings'

const gridSettings = useGridSettingsStore()

function onSizeChange(e: Event) {
  const val = parseInt((e.target as HTMLInputElement).value, 10)
  if (!isNaN(val) && val >= 2) {
    gridSettings.gridSize = val
  } else {
    (e.target as HTMLInputElement).value = String(gridSettings.gridSize)
  }
}
</script>
