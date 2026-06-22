<template>
  <div class="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-[var(--color-border)] bg-[var(--color-surface-2)]/90 px-2 py-2 pb-safe backdrop-blur-lg">
    <button
      class="relative flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[var(--color-text-muted)] transition active:bg-white/10"
      @click="$emit('showSnips')"
    >
      <Layers class="size-5" />
      <span class="text-[10px]">Snips</span>
      <span
        v-if="snipCount > 0"
        class="absolute -top-0.5 right-0.5 flex size-4 items-center justify-center rounded-full bg-[var(--color-accent)] text-[9px] font-bold text-[var(--color-on-accent)]"
      >
        {{ snipCount > 9 ? '9+' : snipCount }}
      </span>
    </button>

    <button
      class="relative flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[var(--color-text-muted)] transition active:bg-white/10"
      @click="$emit('showMockups')"
    >
      <LayoutGrid class="size-5" />
      <span class="text-[10px]">Mockups</span>
      <span
        v-if="mockupCount > 0"
        class="absolute -top-0.5 right-0.5 flex size-4 items-center justify-center rounded-full bg-[var(--color-accent)] text-[9px] font-bold text-[var(--color-on-accent)]"
      >
        {{ mockupCount > 9 ? '9+' : mockupCount }}
      </span>
    </button>

    <button
      class="flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[var(--color-text-muted)] transition active:bg-white/10"
      @click="$emit('addSource')"
    >
      <Plus class="size-5" />
      <span class="text-[10px]">Source</span>
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
import { Layers, LayoutGrid, Plus, ArrowUpFromLine } from 'lucide-vue-next'

defineProps<{ snipCount: number; mockupCount: number }>()
defineEmits<{
  showSnips: []
  showMockups: []
  addSource: []
  export: []
}>()
</script>
