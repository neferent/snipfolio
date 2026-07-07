<template>
  <div class="flex h-12 w-full items-center justify-center">
    <!-- Laptop + Phone -->
    <div v-if="preset === 'laptop+phone'" class="relative h-9 w-16">
      <div class="absolute left-0 top-1.5 h-6 w-11 rounded-[2px] border border-overlay/25 bg-overlay/10" />
      <div class="absolute right-0 top-0 h-9 w-4 rounded-[3px] border border-overlay/40 bg-overlay/20" />
    </div>

    <!-- Laptop + Tablet + Phone -->
    <div v-else-if="preset === 'laptop+tablet+phone'" class="relative h-9 w-16">
      <div class="absolute left-0 top-2 h-5 w-9 rounded-[2px] border border-overlay/20 bg-overlay/10" />
      <div class="absolute left-6 top-0.5 h-8 w-6 rounded-[2px] border border-overlay/30 bg-overlay/15" />
      <div class="absolute right-0 top-0 h-9 w-3.5 rounded-[3px] border border-overlay/40 bg-overlay/20" />
    </div>

    <!-- Browser -->
    <div v-else-if="preset === 'browser'" class="h-9 w-16 overflow-hidden rounded-[3px] border border-overlay/30 bg-overlay/10">
      <div class="flex h-2.5 items-center gap-0.5 border-b border-overlay/20 bg-overlay/10 px-1">
        <span class="size-1 rounded-full bg-overlay/40" />
        <span class="size-1 rounded-full bg-overlay/40" />
        <span class="size-1 rounded-full bg-overlay/40" />
      </div>
    </div>

    <!-- Browser + URL -->
    <div v-else-if="preset === 'browser+url'" class="flex flex-col items-center gap-1.5">
      <div class="h-7 w-16 overflow-hidden rounded-[3px] border border-overlay/30 bg-overlay/10">
        <div class="flex h-2.5 items-center gap-0.5 border-b border-overlay/20 bg-overlay/10 px-1">
          <span class="size-1 rounded-full bg-overlay/40" />
          <span class="size-1 rounded-full bg-overlay/40" />
          <span class="size-1 rounded-full bg-overlay/40" />
        </div>
      </div>
      <div class="h-1.5 w-10 rounded-full bg-overlay/20" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CapturePreset } from '~/composables/useUrlCapture'

defineProps<{ preset: CapturePreset }>()
</script>
