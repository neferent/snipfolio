<template>
  <div class="flex items-center gap-1.5 font-mono text-[12px]">
    <template v-if="status === 'saving'">
      <span class="inline-block size-1.5 animate-pulse rounded-full bg-[var(--color-warning)]" />
      <span class="text-[var(--color-text-muted)]">Saving…</span>
    </template>

    <template v-else-if="status === 'saved'">
      <span class="inline-block size-1.5 rounded-full bg-[var(--color-success)]" />
      <span class="text-[var(--color-text-muted)]">Saved</span>
    </template>

    <template v-else-if="status === 'unsaved'">
      <span class="inline-block size-1.5 rounded-full bg-[var(--color-danger)]" />
      <span class="text-[var(--color-danger)]">Unsaved</span>
    </template>

    <template v-else-if="status === 'error'">
      <span class="inline-block size-1.5 rounded-full bg-red-500" />
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
