<template>
  <MenuItem v-slot="{ active }" :disabled="disabled">
    <button
      class="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-sm transition-colors rounded-[5px]"
      :style="[
        active && !danger ? 'background:rgba(142,158,173,0.12);color:var(--color-text)' : '',
        active && danger  ? 'background:rgba(240,149,149,0.12);color:var(--color-danger)' : '',
        !active && danger ? 'color:var(--color-danger)' : '',
        !active && !danger ? 'color:var(--color-text)' : '',
        disabled ? 'color:var(--color-text-muted);cursor:not-allowed' : 'cursor:pointer',
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
