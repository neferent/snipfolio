<template>
  <div class="space-y-4">
    <!-- Type selector -->
    <div class="space-y-1.5">
      <label style="font-size:11px;font-weight:500;letter-spacing:0.07em;text-transform:uppercase;color:#4a5e6e">Background</label>
      <div class="grid grid-cols-2 gap-1">
        <button
          v-for="t in types"
          :key="t.value"
          class="py-1.5 text-xs transition"
          :style="modelValue.type === t.value
            ? 'border-radius:6px;border:1.5px solid #8e9ead;background:rgba(142,158,173,0.08);color:#e2e6ea'
            : 'border-radius:6px;border:0.5px solid rgba(255,255,255,0.06);color:#6b7280'"
          @click="update('type', t.value as BackgroundConfig['type'])"
        >
          {{ t.label }}
        </button>
      </div>
    </div>

    <!-- Solid -->
    <template v-if="modelValue.type === 'solid'">
      <div class="space-y-1.5">
        <label class="text-xs text-[var(--color-text-muted)]">Color</label>
        <AppColorPicker :model-value="modelValue.color!" @update:model-value="update('color', $event)" />
      </div>
    </template>

    <!-- Gradient -->
    <template v-else-if="modelValue.type === 'gradient'">
      <!-- Presets -->
      <div class="space-y-1.5">
        <label class="text-xs text-[var(--color-text-muted)]">Presets</label>
        <div class="grid grid-cols-4 gap-1.5">
          <button
            v-for="preset in gradientPresets"
            :key="preset.label"
            class="h-8 w-full rounded-[6px] transition hover:ring-2 hover:ring-[var(--color-accent)] hover:ring-offset-1 hover:ring-offset-[var(--color-surface-2)]"
            :style="`background: linear-gradient(${preset.angle}deg, ${preset.start}, ${preset.end})`"
            :title="preset.label"
            @click="applyGradientPreset(preset)"
          />
        </div>
      </div>

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

    <!-- Image -->
    <template v-else-if="modelValue.type === 'image'">
      <div class="space-y-2">
        <label class="text-xs text-[var(--color-text-muted)]">Image</label>

        <!-- Preview -->
        <div v-if="modelValue.imageDataUrl" class="relative overflow-hidden rounded-[6px]" style="aspect-ratio:16/9">
          <img :src="modelValue.imageDataUrl" class="h-full w-full object-cover" />
          <button
            class="absolute right-1.5 top-1.5 rounded-[4px] bg-black/60 px-1.5 py-0.5 text-[10px] text-white transition hover:bg-black/80"
            @click="update('imageDataUrl', undefined)"
          >
            Remove
          </button>
        </div>

        <!-- Upload dropzone -->
        <label
          class="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[6px] py-4 text-xs text-[var(--color-text-muted)] transition hover:text-[var(--color-text)]"
          style="border:1px dashed rgba(255,255,255,0.12)"
        >
          <Upload class="size-4" />
          <span>{{ modelValue.imageDataUrl ? 'Replace image' : 'Upload image' }}</span>
          <span style="font-size:10px;color:#4a5e6e">JPG, PNG, WebP</span>
          <input type="file" accept="image/*" class="sr-only" @change="onImageFile" />
        </label>
      </div>
    </template>

    <!-- Blur -->
    <template v-else-if="modelValue.type === 'blur'">
      <p class="text-xs text-[var(--color-text-muted)]">
        Uses a blurred + darkened region from the source screenshot as background.
      </p>
    </template>

    <!-- Noise overlay (all types) -->
    <div class="space-y-1" style="border-top:0.5px solid rgba(255,255,255,0.06);padding-top:12px">
      <label class="flex items-center justify-between" style="font-size:12px;color:#6b7280">
        Noise
        <span style="font-family:var(--font-mono);color:#8e9ead">{{ Math.round((modelValue.noiseOpacity ?? 0) * 100) }}%</span>
      </label>
      <input
        type="range"
        min="0"
        max="0.5"
        step="0.01"
        :value="modelValue.noiseOpacity ?? 0"
        class="w-full"
        @input="update('noiseOpacity', Number(($event.target as HTMLInputElement).value))"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Upload } from 'lucide-vue-next'
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
  { value: 'image', label: 'Image' },
  { value: 'blur', label: 'Blur' },
]

const gradientPresets = [
  { label: 'Midnight', start: '#0f0c29', end: '#302b63', angle: 135 },
  { label: 'Ocean', start: '#667eea', end: '#764ba2', angle: 135 },
  { label: 'Sunset', start: '#f093fb', end: '#f5576c', angle: 135 },
  { label: 'Amber', start: '#f7971e', end: '#ffd200', angle: 135 },
  { label: 'Forest', start: '#134e5e', end: '#71b280', angle: 135 },
  { label: 'Rose', start: '#ee0979', end: '#ff6a00', angle: 135 },
  { label: 'Slate', start: '#1e3c72', end: '#2a5298', angle: 180 },
  { label: 'Dusk', start: '#1a1a2e', end: '#16213e', angle: 135 },
]

function update<K extends keyof BackgroundConfig>(key: K, value: BackgroundConfig[K]) {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}

function applyGradientPreset(preset: { start: string; end: string; angle: number }) {
  emit('update:modelValue', {
    ...props.modelValue,
    type: 'gradient',
    gradientStart: preset.start,
    gradientEnd: preset.end,
    gradientAngle: preset.angle,
  })
}

function onImageFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    update('imageDataUrl', reader.result as string)
  }
  reader.readAsDataURL(file)
}
</script>
