<template>
  <div class="space-y-3">
    <p class="text-xs text-[var(--color-text-muted)]">Choose what to capture for {{ hostname }}</p>
    <div class="grid grid-cols-2 gap-3">
      <button
        v-for="p in CAPTURE_PRESETS"
        :key="p.id"
        type="button"
        class="flex flex-col items-center gap-2 rounded-lg border p-3 text-center transition hover:bg-white/5"
        :class="modelValue === p.id ? 'border-[#8e9ead]/60 bg-white/5' : 'border-white/10 hover:border-white/20'"
        @click="$emit('update:modelValue', p.id)"
      >
        <CapturePresetThumbnail :preset="p.id" />
        <span class="text-xs font-medium text-[var(--color-text)]">{{ p.label }}</span>
        <span class="text-[10px] text-[var(--color-text-muted)]">{{ p.description }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CAPTURE_PRESETS } from '~/composables/useUrlCapture'
import type { CapturePreset } from '~/composables/useUrlCapture'

defineProps<{ hostname: string; modelValue: CapturePreset }>()
defineEmits<{ 'update:modelValue': [preset: CapturePreset] }>()
</script>
