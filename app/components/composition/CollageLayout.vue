<template>
  <div class="space-y-4">
    <!-- Warning box -->
    <div class="relative overflow-hidden rounded-[6px] px-3 py-2.5 text-xs leading-relaxed text-[var(--color-text-muted)] bg-[rgba(239,159,39,0.08)] [border:0.5px_solid_rgba(239,159,39,0.2)]">
      <div class="absolute inset-y-0 left-0 w-[3px] rounded-full bg-[var(--color-warning)]" />
      <span class="pl-2">Frames are not supported in Auto-Collage. Content may be slightly clipped to fill the canvas.</span>
    </div>

    <!-- Gap slider -->
    <div class="space-y-1.5">
      <label class="flex items-center justify-between text-[12px] text-[var(--color-text-muted)]">
        Gap
        <span class="font-mono text-[var(--color-accent)]">{{ modelValue.gap }}px</span>
      </label>
      <input
        type="range"
        min="0"
        max="60"
        :value="modelValue.gap"
        class="w-full"
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
