<template>
  <div class="flex items-center gap-1.5 text-xs">
    <template v-if="status === 'saving'">
      <svg class="size-3 animate-spin text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <span class="text-[var(--color-text-muted)]">Saving…</span>
    </template>

    <template v-else-if="status === 'saved'">
      <svg class="size-3 text-[var(--color-success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
      </svg>
      <span class="text-[var(--color-text-muted)]">Saved</span>
    </template>

    <template v-else-if="status === 'unsaved'">
      <div class="size-2 rounded-full bg-[var(--color-warning)]" />
      <span class="text-[var(--color-text-muted)]">Unsaved changes</span>
    </template>

    <template v-else-if="status === 'error'">
      <svg class="size-3 text-[var(--color-danger)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
      <span class="text-[var(--color-danger)]">Save failed</span>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { SaveStatus } from '~/stores/project'

defineProps<{
  status: SaveStatus
}>()
</script>
