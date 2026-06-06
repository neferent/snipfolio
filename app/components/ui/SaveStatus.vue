<template>
  <div class="flex items-center gap-1.5" style="font-family:var(--font-mono);font-size:12px">
    <template v-if="status === 'saving'">
      <span class="inline-block size-1.5 animate-pulse rounded-full" style="background:#ef9f27" />
      <span class="text-[var(--color-text-muted)]">Saving…</span>
    </template>

    <template v-else-if="status === 'saved'">
      <span class="inline-block size-1.5 rounded-full" style="background:#5dcaa5" />
      <span class="text-[var(--color-text-muted)]">Saved</span>
    </template>

    <template v-else-if="status === 'unsaved'">
      <span class="inline-block size-1.5 rounded-full" style="background:#f09595" />
      <span style="color:#f09595">Unsaved</span>
    </template>

    <template v-else-if="status === 'error'">
      <span class="inline-block size-1.5 rounded-full" style="background:#ef4444" />
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
