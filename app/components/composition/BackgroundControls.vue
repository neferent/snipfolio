<template>
  <div class="space-y-4">
    <div class="space-y-1.5">
      <label class="text-xs font-medium text-[var(--color-text-muted)]">Background</label>
      <div class="flex gap-1.5">
        <button
          v-for="t in types"
          :key="t.value"
          class="flex-1 rounded-lg border py-1.5 text-xs transition"
          :class="
            modelValue.type === t.value
              ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/15 text-[var(--color-accent)]'
              : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-white/20'
          "
          @click="update('type', t.value as BackgroundConfig['type'])"
        >
          {{ t.label }}
        </button>
      </div>
    </div>

    <template v-if="modelValue.type === 'solid'">
      <div class="space-y-1.5">
        <label class="text-xs text-[var(--color-text-muted)]">Color</label>
        <div class="flex items-center gap-2">
          <input
            type="color"
            :value="modelValue.color"
            class="h-8 w-10 cursor-pointer rounded border border-[var(--color-border)] bg-transparent"
            @input="update('color', ($event.target as HTMLInputElement).value)"
          />
          <input
            :value="modelValue.color"
            class="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-3)] px-2 py-1.5 font-mono text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
            @input="update('color', ($event.target as HTMLInputElement).value)"
          />
        </div>
      </div>
    </template>

    <template v-else-if="modelValue.type === 'gradient'">
      <div class="space-y-1.5">
        <label class="text-xs text-[var(--color-text-muted)]">Start color</label>
        <div class="flex items-center gap-2">
          <input
            type="color"
            :value="modelValue.gradientStart"
            class="h-8 w-10 cursor-pointer rounded border border-[var(--color-border)] bg-transparent"
            @input="update('gradientStart', ($event.target as HTMLInputElement).value)"
          />
          <input
            :value="modelValue.gradientStart"
            class="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-3)] px-2 py-1.5 font-mono text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
            @input="update('gradientStart', ($event.target as HTMLInputElement).value)"
          />
        </div>
      </div>

      <div class="space-y-1.5">
        <label class="text-xs text-[var(--color-text-muted)]">End color</label>
        <div class="flex items-center gap-2">
          <input
            type="color"
            :value="modelValue.gradientEnd"
            class="h-8 w-10 cursor-pointer rounded border border-[var(--color-border)] bg-transparent"
            @input="update('gradientEnd', ($event.target as HTMLInputElement).value)"
          />
          <input
            :value="modelValue.gradientEnd"
            class="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-3)] px-2 py-1.5 font-mono text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
            @input="update('gradientEnd', ($event.target as HTMLInputElement).value)"
          />
        </div>
      </div>

      <div class="space-y-1.5">
        <label class="text-xs text-[var(--color-text-muted)]">
          Angle: {{ modelValue.gradientAngle }}°
        </label>
        <input
          type="range"
          min="0"
          max="360"
          :value="modelValue.gradientAngle"
          class="w-full accent-[var(--color-accent)]"
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
