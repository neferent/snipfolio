<template>
  <div class="space-y-4">
    <div class="space-y-2">
      <label class="text-xs font-medium text-[var(--color-text-muted)]">Layout template</label>
      <div class="grid grid-cols-2 gap-2">
        <button
          v-for="t in templates"
          :key="t.value"
          class="flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs transition"
          :class="
            modelValue.template === t.value
              ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/15 text-[var(--color-accent)]'
              : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-white/20'
          "
          @click="update('template', t.value)"
        >
          <div class="flex h-8 w-full items-center justify-center" v-html="t.icon" />
          <span>{{ t.label }}</span>
        </button>
      </div>
    </div>

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

    <!-- Per-slot frame assignment -->
    <div class="space-y-2">
      <label class="text-xs font-medium text-[var(--color-text-muted)]">Per-slot frames</label>
      <div
        v-for="(slot, i) in modelValue.slots"
        :key="slot.snipId"
        class="flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-2"
      >
        <span class="text-xs text-[var(--color-text-muted)]">Slot {{ i + 1 }}</span>
        <span class="flex-1 truncate text-xs text-[var(--color-text)]">
          {{ snipLabel(slot.snipId) }}
        </span>
        <select
          :value="slot.deviceFrame"
          class="rounded border border-[var(--color-border)] bg-[var(--color-surface-3)] px-1.5 py-0.5 text-xs text-[var(--color-text)] outline-none"
          @change="updateSlotFrame(i, ($event.target as HTMLSelectElement).value as DeviceFrame)"
        >
          <option value="none">None</option>
          <option value="phone">Phone</option>
          <option value="browser">Browser</option>
          <option value="laptop">Laptop</option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSnipsStore } from '~/stores/snips'
import type { CollageCompositionConfig, CollageLayoutTemplate, DeviceFrame } from '~/types'

const props = defineProps<{
  modelValue: CollageCompositionConfig
}>()

const emit = defineEmits<{
  'update:modelValue': [value: CollageCompositionConfig]
}>()

const snipsStore = useSnipsStore()

const templates: { value: CollageLayoutTemplate; label: string; icon: string }[] = [
  {
    value: '2-horizontal',
    label: '2 Side-by-Side',
    icon: '<div class="flex gap-1 w-full h-full"><div class="flex-1 rounded-sm bg-current opacity-40"/><div class="flex-1 rounded-sm bg-current opacity-40"/></div>',
  },
  {
    value: '2-vertical',
    label: '2 Stacked',
    icon: '<div class="flex flex-col gap-1 w-full h-full"><div class="flex-1 rounded-sm bg-current opacity-40"/><div class="flex-1 rounded-sm bg-current opacity-40"/></div>',
  },
  {
    value: '3-up',
    label: '3-up (1+2)',
    icon: '<div class="flex gap-1 w-full h-full"><div class="flex-1 rounded-sm bg-current opacity-40"/><div class="flex flex-col gap-1 w-2/5"><div class="flex-1 rounded-sm bg-current opacity-40"/><div class="flex-1 rounded-sm bg-current opacity-40"/></div></div>',
  },
  {
    value: '2x2',
    label: '2×2 Grid',
    icon: '<div class="grid grid-cols-2 gap-1 w-full h-full"><div class="rounded-sm bg-current opacity-40"/><div class="rounded-sm bg-current opacity-40"/><div class="rounded-sm bg-current opacity-40"/><div class="rounded-sm bg-current opacity-40"/></div>',
  },
  {
    value: '1+2-stacked',
    label: '1+2 Bottom',
    icon: '<div class="flex flex-col gap-1 w-full h-full"><div class="flex-1 rounded-sm bg-current opacity-40"/><div class="flex gap-1 h-2/5"><div class="flex-1 rounded-sm bg-current opacity-40"/><div class="flex-1 rounded-sm bg-current opacity-40"/></div></div>',
  },
  {
    value: 'free',
    label: 'Free',
    icon: '<div class="relative w-full h-full"><div class="absolute top-0 left-0 w-3/5 h-3/5 rounded-sm bg-current opacity-40"/><div class="absolute bottom-0 right-0 w-3/5 h-3/5 rounded-sm bg-current opacity-30"/></div>',
  },
]

function snipLabel(id: string) {
  return snipsStore.snips.find((s) => s.id === id)?.label ?? id
}

function update<K extends keyof CollageCompositionConfig>(
  key: K,
  value: CollageCompositionConfig[K],
) {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}

function updateSlotFrame(index: number, frame: DeviceFrame) {
  const slots = props.modelValue.slots.map((s, i) =>
    i === index ? { ...s, deviceFrame: frame } : s,
  )
  emit('update:modelValue', { ...props.modelValue, slots })
}
</script>
