<template>
  <MenuItem v-slot="{ active }" :disabled="disabled">
    <button
      class="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition"
      :class="[
        active ? 'bg-white/10 text-[var(--color-text)]' : 'text-[var(--color-text-muted)]',
        danger && active ? '!text-[var(--color-danger)]' : '',
        disabled ? 'cursor-not-allowed opacity-50' : '',
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
