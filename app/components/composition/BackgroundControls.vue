<template>
  <div class="space-y-4">
    <!-- Type selector -->
    <div class="space-y-1.5">
      <label class="text-xs text-[var(--color-text-faint)]" style="font-size:11px;font-weight:500;letter-spacing:0.07em;text-transform:uppercase">Background</label>
      <div class="flex gap-1.5">
        <button
          v-for="t in types"
          :key="t.value"
          class="flex-1 py-1.5 text-xs transition"
          :style="modelValue.type === t.value
            ? 'border-radius:6px;border:1.5px solid #8e9ead;background:rgba(142,158,173,0.08);color:#e2e6ea'
            : 'border-radius:6px;border:0.5px solid rgba(255,255,255,0.06);color:#6b7280'"
          @click="update('type', t.value as BackgroundConfig['type'])"
        >
          {{ t.label }}
        </button>
      </div>
    </div>

    <template v-if="modelValue.type === 'solid'">
      <div class="space-y-1.5">
        <label class="text-xs text-[var(--color-text-muted)]">Color</label>
        <AppColorPicker :model-value="modelValue.color!" @update:model-value="update('color', $event)" />
      </div>
    </template>

    <template v-else-if="modelValue.type === 'gradient'">
      <div class="space-y-1.5">
        <label class="text-xs text-[var(--color-text-muted)]">Start color</label>
        <AppColorPicker :model-value="modelValue.gradientStart!" @update:model-value="update('gradientStart', $event)" />
      </div>

      <div class="space-y-1.5">
        <label class="text-xs text-[var(--color-text-muted)]">End color</label>
        <AppColorPicker :model-value="modelValue.gradientEnd!" @update:model-value="update('gradientEnd', $event)" />
      </div>

      <div class="space-y-1.5">
        <label class="flex items-center justify-between" style="font-size:12px;color:#6b7280">
          Angle
          <span style="font-family:var(--font-mono);color:#8e9ead">{{ modelValue.gradientAngle }}°</span>
        </label>
        <input
          type="range"
          min="0"
          max="360"
          :value="modelValue.gradientAngle"
          class="w-full"
          @input="update('gradientAngle', Number(($event.target as HTMLInputElement).value))"
        />
      </div>
    </template>

    <template v-else-if="modelValue.type === 'blur'">
      <p class="text-xs text-[var(--color-text-muted)]">
        Uses a blurred + darkened region from the source screenshot as background.
      </p>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { BackgroundConfig } from '~/types'

const props = defineProps<{
  modelValue: BackgroundConfig
}>()

const emit = defineEmits<{
  'update:modelValue': [value: BackgroundConfig]
}>()

const types = [
  { value: 'solid', label: 'Solid' },
  { value: 'gradient', label: 'Gradient' },
  { value: 'blur', label: 'Blur' },
]

function update<K extends keyof BackgroundConfig>(key: K, value: BackgroundConfig[K]) {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}
</script>
