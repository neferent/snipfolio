<template>
  <div class="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-[var(--color-border)] bg-[var(--color-surface-2)]/90 px-2 py-2 pb-safe backdrop-blur-lg">
    <button
      class="flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[var(--color-text-muted)] transition active:bg-white/10"
      @click="$emit('showLayers')"
    >
      <Layers class="size-5" />
      <span class="text-[10px]">Layers</span>
    </button>

    <button
      class="flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[var(--color-text-muted)] transition active:bg-white/10"
      @click="$emit('showSlot')"
    >
      <SlidersHorizontal class="size-5" />
      <span class="text-[10px]">Slot</span>
    </button>

    <button
      class="flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[var(--color-text-muted)] transition active:bg-white/10"
      @click="$emit('showSettings')"
    >
      <Settings class="size-5" />
      <span class="text-[10px]">Settings</span>
    </button>

    <button
      v-if="hasSelection"
      class="flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[var(--color-text-muted)] transition active:bg-white/10"
      @click="$emit('center')"
    >
      <AlignCenter class="size-5" />
      <span class="text-[10px]">Center</span>
    </button>

    <button
      v-if="hasSelection"
      class="flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[var(--color-text-muted)] transition active:bg-red-500/20"
      @click="$emit('deleteSlot')"
    >
      <Trash2 class="size-5" />
      <span class="text-[10px]">Delete</span>
    </button>

    <button
      class="flex flex-col items-center gap-0.5 rounded-lg bg-[var(--color-accent)] px-3 py-1.5 text-[var(--color-on-accent)] transition active:bg-[var(--color-accent-hover)]"
      @click="$emit('export')"
    >
      <ArrowUpFromLine class="size-5" />
      <span class="text-[10px] font-medium">Export</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { Layers, SlidersHorizontal, Settings, AlignCenter, Trash2, ArrowUpFromLine } from 'lucide-vue-next'

defineProps<{ hasSelection: boolean }>()
defineEmits<{
  showLayers: []
  showSlot: []
  showSettings: []
  center: []
  deleteSlot: []
  export: []
}>()
</script>
