<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <label class="text-xs font-medium text-[var(--color-text-muted)]">{{ label }}</label>
      <button
        class="text-xs transition"
        :class="enabled ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'"
        @click="toggleEnabled"
      >
        {{ enabled ? 'On' : 'Off' }}
      </button>
    </div>

    <template v-if="enabled && modelValue">
      <input
        :value="modelValue.text"
        class="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-3)] px-3 py-1.5 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
        placeholder="Caption text…"
        @input="update('text', ($event.target as HTMLInputElement).value)"
      />

      <div class="grid grid-cols-2 gap-2">
        <div class="space-y-1">
          <label class="text-[10px] text-[var(--color-text-muted)]">Position</label>
          <div class="flex gap-1">
            <button
              v-for="pos in ['top', 'bottom']"
              :key="pos"
              class="flex-1 rounded border py-1 text-xs capitalize transition"
              :class="
                modelValue.position === pos
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/15 text-[var(--color-accent)]'
                  : 'border-[var(--color-border)] text-[var(--color-text-muted)]'
              "
              @click="update('position', pos as 'top' | 'bottom')"
            >
              {{ pos }}
            </button>
          </div>
        </div>

        <div class="space-y-1">
          <label class="text-[10px] text-[var(--color-text-muted)]">Font size</label>
          <input
            type="number"
            :value="modelValue.size"
            min="10"
            max="72"
            class="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-3)] px-2 py-1 text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
            @input="update('size', Number(($event.target as HTMLInputElement).value))"
          />
        </div>
      </div>

      <div class="space-y-1">
        <label class="text-[10px] text-[var(--color-text-muted)]">
          Bg opacity: {{ Math.round(modelValue.bgOpacity * 100) }}%
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          :value="modelValue.bgOpacity"
          class="w-full accent-[var(--color-accent)]"
          @input="update('bgOpacity', Number(($event.target as HTMLInputElement).value))"
        />
      </div>

      <div class="flex items-center gap-2">
        <label class="text-[10px] text-[var(--color-text-muted)]">Color</label>
        <input
          type="color"
          :value="modelValue.color"
          class="h-7 w-8 cursor-pointer rounded border border-[var(--color-border)] bg-transparent"
          @input="update('color', ($event.target as HTMLInputElement).value)"
        />
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

const DEFAULT: CaptionConfig = {
  text: '',
  size: 18,
  color: '#ffffff',
  position: 'bottom',
  bgOpacity: 0.6,
}

function toggleEnabled() {
  emit('update:modelValue', enabled.value ? undefined : { ...DEFAULT })
}

function update<K extends keyof CaptionConfig>(key: K, value: CaptionConfig[K]) {
  if (!props.modelValue) return
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}
</script>
