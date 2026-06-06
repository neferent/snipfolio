<template>
  <div class="flex items-center gap-1 rounded-lg bg-[var(--color-surface-3)] p-1 ring-1 ring-white/5">
    <button
      class="rounded px-2 py-1 text-xs text-[var(--color-text-muted)] transition hover:bg-white/10 hover:text-[var(--color-text)]"
      title="Fit to width"
      @click="$emit('fit-width')"
    >
      ↔
    </button>
    <button
      class="rounded px-2 py-1 text-xs text-[var(--color-text-muted)] transition hover:bg-white/10 hover:text-[var(--color-text)]"
      title="Fit to height"
      @click="$emit('fit-height')"
    >
      ↕
    </button>
    <div class="mx-1 h-4 w-px bg-[var(--color-border)]" />
    <button
      v-for="level in zoomLevels"
      :key="level"
      class="rounded px-2 py-1 text-xs transition"
      :class="
        modelValue === level
          ? 'bg-[var(--color-accent)] text-[#111316]'
          : 'text-[var(--color-text-muted)] hover:bg-white/10 hover:text-[var(--color-text)]'
      "
      @click="$emit('update:modelValue', level)"
    >
      {{ Math.round(level * 100) }}%
    </button>
    <div class="mx-1 h-4 w-px bg-[var(--color-border)]" />
    <button
      class="rounded px-2 py-1 text-xs text-[var(--color-text-muted)] transition hover:bg-white/10 hover:text-[var(--color-text)]"
      :disabled="modelValue <= 0.1"
      @click="$emit('update:modelValue', Math.max(0.1, modelValue - 0.1))"
    >
      −
    </button>
    <span class="min-w-10 text-center text-xs text-[var(--color-text-muted)]">
      {{ Math.round(modelValue * 100) }}%
    </span>
    <button
      class="rounded px-2 py-1 text-xs text-[var(--color-text-muted)] transition hover:bg-white/10 hover:text-[var(--color-text)]"
      :disabled="modelValue >= 3"
      @click="$emit('update:modelValue', Math.min(3, modelValue + 0.1))"
    >
      +
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
