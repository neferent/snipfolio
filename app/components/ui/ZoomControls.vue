<template>
  <div class="flex items-center gap-1 rounded-lg bg-[var(--color-surface-3)] p-1 ring-1 ring-overlay/5">
    <button
      class="rounded px-2 py-1 text-xs text-[var(--color-text-muted)] transition hover:bg-overlay/10 hover:text-[var(--color-text)]"
      title="Fit to width"
      aria-label="Fit to width"
      @click="$emit('fit-width')"
    >
      <span aria-hidden="true">↔</span>
    </button>
    <button
      class="rounded px-2 py-1 text-xs text-[var(--color-text-muted)] transition hover:bg-overlay/10 hover:text-[var(--color-text)]"
      title="Fit to height"
      aria-label="Fit to height"
      @click="$emit('fit-height')"
    >
      <span aria-hidden="true">↕</span>
    </button>
    <div class="mx-1 h-4 w-px bg-[var(--color-border)]" />
    <button
      v-for="level in zoomLevels"
      :key="level"
      class="rounded px-2 py-1 text-xs transition"
      :class="
        modelValue === level
          ? 'bg-[var(--color-accent)] text-[var(--color-on-accent)]'
          : 'text-[var(--color-text-muted)] hover:bg-overlay/10 hover:text-[var(--color-text)]'
      "
      @click="$emit('update:modelValue', level)"
    >
      {{ Math.round(level * 100) }}%
    </button>
    <div class="mx-1 h-4 w-px bg-[var(--color-border)]" />
    <button
      class="rounded px-2 py-1 text-xs text-[var(--color-text-muted)] transition hover:bg-overlay/10 hover:text-[var(--color-text)]"
      :disabled="modelValue <= 0.1"
      aria-label="Zoom out"
      @click="$emit('update:modelValue', Math.max(0.1, modelValue - 0.1))"
    >
      <span aria-hidden="true">−</span>
    </button>
    <span class="min-w-10 text-center text-xs text-[var(--color-text-muted)]" aria-live="polite" aria-atomic="true">
      {{ Math.round(modelValue * 100) }}%
    </span>
    <button
      class="rounded px-2 py-1 text-xs text-[var(--color-text-muted)] transition hover:bg-overlay/10 hover:text-[var(--color-text)]"
      :disabled="modelValue >= 3"
      aria-label="Zoom in"
      @click="$emit('update:modelValue', Math.min(3, modelValue + 0.1))"
    >
      <span aria-hidden="true">+</span>
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: number
}>()

defineEmits<{
  'update:modelValue': [value: number]
  'fit-width': []
  'fit-height': []
}>()

const zoomLevels = [0.5, 1, 1.5]
</script>
