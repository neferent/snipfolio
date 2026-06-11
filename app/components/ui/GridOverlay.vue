<template>
  <div
    v-if="visible && cellSize >= 4"
    class="pointer-events-none absolute inset-0"
    :style="{
      backgroundImage:
        'linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), '
        + 'linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)',
      backgroundSize: `${cellSize}px ${cellSize}px`,
    }"
  />
</template>

<script setup lang="ts">
const props = defineProps<{
  visible: boolean
  size: number
}>()

// Round to whole pixels — fractional background-size on a repeating grid
// causes severe moiré/aliasing artifacts that can look like a solid overlay.
const cellSize = computed(() => Math.round(props.size))
</script>
