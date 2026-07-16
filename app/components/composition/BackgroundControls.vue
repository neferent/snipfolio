<template>
  <div class="space-y-4">
    <!-- Type selector -->
    <div class="space-y-1.5">
      <div class="grid grid-cols-2 gap-1">
        <button
          v-for="t in types"
          :key="t.value"
          class="py-1.5 text-xs transition"
          :style="modelValue.type === t.value
            ? 'border-radius:6px;border:1.5px solid var(--color-accent);background:rgba(142,158,173,0.08);color:var(--color-text)'
            : 'border-radius:6px;border:0.5px solid var(--color-border);color:var(--color-text-muted)'"
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
        <label class="flex items-center justify-between text-[12px] text-[var(--color-text-muted)]">
          Angle
          <span class="font-mono text-[var(--color-accent)]">{{ modelValue.gradientAngle }}°</span>
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
        <div v-if="modelValue.imageDataUrl" class="relative aspect-video overflow-hidden rounded-[6px]">
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
          class="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[6px] py-4 text-xs text-[var(--color-text-muted)] transition hover:text-[var(--color-text)] border border-dashed border-[var(--color-border-strong)]"
        >
          <Upload class="size-4" />
          <span>{{ modelValue.imageDataUrl ? 'Replace image' : 'Upload image' }}</span>
          <span class="text-[10px] text-[var(--color-text-faint)]">JPG, PNG, WebP</span>
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
    <div class="space-y-1 border-t-subtle pt-3">
      <label class="flex items-center justify-between text-[12px] text-[var(--color-text-muted)]">
        Noise
        <span class="font-mono text-[var(--color-accent)]">{{ Math.round((modelValue.noiseOpacity ?? 0) * 100) }}%</span>
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
  { value: 'blur', label: 'Blur' },
  { value: 'gradient', label: 'Gradient' },
  { value: 'solid', label: 'Solid' },
  { value: 'image', label: 'Image' },
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
