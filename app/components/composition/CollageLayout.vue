<template>
  <div class="space-y-4">
    <p class="text-xs text-[var(--color-text-muted)] rounded-lg border border-[var(--color-border)] px-3 py-2 leading-relaxed">
      Frames are not supported in Auto-Collage. Content may be slightly clipped to fill the canvas.
    </p>

    <div class="space-y-1.5">
      <label class="text-xs text-[var(--color-text-muted)]">Gap: {{ modelValue.gap }}px</label>
      <input
        type="range"
        min="0"
        max="60"
        :value="modelValue.gap"
        class="w-full accent-[var(--color-accent)]"
        @input="update('gap', Number(($event.target as HTMLInputElement).value))"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CollageCompositionConfig } from '~/types'

const props = defineProps<{
  modelValue: CollageCompositionConfig
}>()

const emit = defineEmits<{
  'update:modelValue': [value: CollageCompositionConfig]
}>()

function update<K extends keyof CollageCompositionConfig>(
  key: K,
  value: CollageCompositionConfig[K],
) {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}
</script>
