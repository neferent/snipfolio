<template>
  <MenuItem v-slot="{ active }" :disabled="disabled">
    <button
      class="flex w-full items-center gap-2 px-2.5 py-1.5 text-left transition-colors"
      style="border-radius:5px;font-size:13px;font-weight:400"
      :style="[
        active && !danger ? 'background:rgba(142,158,173,0.12);color:#e2e6ea' : '',
        active && danger  ? 'background:rgba(240,149,149,0.12);color:#f09595' : '',
        !active && danger ? 'color:#f09595' : '',
        !active && !danger ? 'color:#e2e6ea' : '',
        disabled ? 'color:#6b7280;cursor:not-allowed' : 'cursor:pointer',
      ]"
      @click="$emit('click')"
    >
      <slot />
    </button>
  </MenuItem>
</template>

<script setup lang="ts">
import { MenuItem } from '@headlessui/vue'

defineProps<{
  disabled?: boolean
  danger?: boolean
}>()

defineEmits<{ click: [] }>()
</script>
