<template>
  <div class="space-y-3">
    <!-- Header row -->
    <div class="flex items-center justify-between py-1">
      <span style="font-size:13px;color:#e2e6ea">{{ label }}</span>
      <button
        class="transition"
        :class="enabled ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'"
        style="font-family:var(--font-mono);font-size:12px"
        @click="toggleEnabled"
      >
        {{ enabled ? 'On' : 'Off' }}
      </button>
    </div>

    <template v-if="enabled && modelValue">
      <input
        :value="modelValue.text"
        class="w-full"
        placeholder="Caption text…"
        @input="update('text', ($event.target as HTMLInputElement).value)"
      />

      <!-- Font family -->
      <div class="space-y-1">
        <label class="text-[10px] text-[var(--color-text-muted)]">Font</label>
        <div class="grid grid-cols-2 gap-1">
          <button
            v-for="f in fonts"
            :key="f.value"
            class="rounded-[6px] py-1 text-xs transition"
            :style="[
              (modelValue.fontFamily ?? DEFAULT.fontFamily) === f.value
                ? 'border:1.5px solid #8e9ead;background:rgba(142,158,173,0.08);color:#e2e6ea'
                : 'border:0.5px solid rgba(255,255,255,0.06);color:#6b7280',
              `font-family:${f.value}`,
            ].join(';')"
            @click="update('fontFamily', f.value)"
          >
            {{ f.label }}
          </button>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-2">
        <!-- Position -->
        <div class="space-y-1">
          <label class="text-[10px] text-[var(--color-text-muted)]">Position</label>
          <div class="flex gap-1">
            <button
              v-for="pos in ['top', 'bottom']"
              :key="pos"
              class="flex-1 rounded-[6px] py-1 text-xs capitalize transition"
              :style="modelValue.position === pos
                ? 'border:1.5px solid #8e9ead;background:rgba(142,158,173,0.08);color:#e2e6ea'
                : 'border:0.5px solid rgba(255,255,255,0.06);color:#6b7280'"
              @click="update('position', pos as 'top' | 'bottom')"
            >
              {{ pos }}
            </button>
          </div>
        </div>

        <!-- Font size -->
        <div class="space-y-1">
          <label class="text-[10px] text-[var(--color-text-muted)]">Size</label>
          <input
            type="number"
            :value="modelValue.size"
            min="10"
            max="120"
            class="w-full"
            @input="update('size', Number(($event.target as HTMLInputElement).value))"
          />
        </div>
      </div>

      <!-- Style row: weight + alignment -->
      <div class="grid grid-cols-2 gap-2">
        <div class="space-y-1">
          <label class="text-[10px] text-[var(--color-text-muted)]">Weight</label>
          <div class="flex gap-1">
            <button
              v-for="w in weights"
              :key="w.value"
              class="flex-1 rounded-[6px] py-1 text-xs transition"
              :style="[
                (modelValue.fontWeight ?? 'normal') === w.value
                  ? 'border:1.5px solid #8e9ead;background:rgba(142,158,173,0.08);color:#e2e6ea'
                  : 'border:0.5px solid rgba(255,255,255,0.06);color:#6b7280',
                `font-weight:${w.value}`,
              ].join(';')"
              @click="update('fontWeight', w.value as 'normal' | 'bold')"
            >
              {{ w.label }}
            </button>
          </div>
        </div>

        <div class="space-y-1">
          <label class="text-[10px] text-[var(--color-text-muted)]">Align</label>
          <div class="flex gap-1">
            <button
              v-for="a in aligns"
              :key="a.value"
              class="flex-1 rounded-[6px] py-1 text-xs transition"
              :style="(modelValue.align ?? 'center') === a.value
                ? 'border:1.5px solid #8e9ead;background:rgba(142,158,173,0.08);color:#e2e6ea'
                : 'border:0.5px solid rgba(255,255,255,0.06);color:#6b7280'"
              :title="a.label"
              @click="update('align', a.value as 'left' | 'center' | 'right')"
            >
              {{ a.icon }}
            </button>
          </div>
        </div>
      </div>

      <!-- Bg opacity -->
      <div class="space-y-1">
        <label class="flex items-center justify-between" style="font-size:12px;color:#6b7280">
          Bg opacity
          <span style="font-family:var(--font-mono);color:#8e9ead">{{ Math.round(modelValue.bgOpacity * 100) }}%</span>
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          :value="modelValue.bgOpacity"
          class="w-full"
          @input="update('bgOpacity', Number(($event.target as HTMLInputElement).value))"
        />
      </div>

      <div class="flex items-center gap-2">
        <label class="text-[10px] text-[var(--color-text-muted)]">Color</label>
        <AppColorPicker :model-value="modelValue.color" @update:model-value="update('color', $event)" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { CaptionConfig } from '~/types'

const props = defineProps<{
  modelValue: CaptionConfig | undefined
  label?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: CaptionConfig | undefined]
}>()

const enabled = computed(() => !!props.modelValue)

const fonts = [
  { label: 'Sans', value: 'system-ui, sans-serif' },
  { label: 'Serif', value: 'Georgia, serif' },
  { label: 'Mono', value: "'Courier New', monospace" },
  { label: 'Impact', value: 'Impact, sans-serif' },
]

const weights = [
  { label: 'Normal', value: 'normal' },
  { label: 'Bold', value: 'bold' },
]

const aligns = [
  { label: 'Left', value: 'left', icon: '⇤' },
  { label: 'Center', value: 'center', icon: '↔' },
  { label: 'Right', value: 'right', icon: '⇥' },
]

const DEFAULT: CaptionConfig = {
  text: '',
  size: 18,
  color: '#ffffff',
  position: 'bottom',
  bgOpacity: 0.6,
  fontFamily: 'system-ui, sans-serif',
  fontWeight: 'normal',
  align: 'center',
}

function toggleEnabled() {
  emit('update:modelValue', enabled.value ? undefined : { ...DEFAULT })
}

function update<K extends keyof CaptionConfig>(key: K, value: CaptionConfig[K]) {
  if (!props.modelValue) return
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}
</script>
