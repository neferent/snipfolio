<template>
  <label class="inline-flex cursor-pointer items-center gap-2 text-sm text-[var(--color-text)]" :class="disabled && 'cursor-not-allowed opacity-55'">
    <input
      v-model="model"
      type="checkbox"
      :disabled="disabled"
      class="peer sr-only"
    >
    <span
      class="flex w-[14px] h-[14px] min-h-0 min-w-0 shrink-0 items-center justify-center rounded-sm border-strong bg-[var(--color-surface)] transition peer-checked:border-[var(--color-accent)] peer-checked:bg-[var(--color-accent)] peer-focus-visible:outline-2 peer-focus-visible:outline-[var(--color-accent)] peer-focus-visible:outline-offset-2"
    >
      <Check v-if="model" :stroke-width="3" class="min-h-0 min-w-0 text-[var(--color-on-accent)]" />
    </span>
    <slot />
  </label>
</template>

<script setup lang="ts">
import { Check } from 'lucide-vue-next'

const model = defineModel<boolean>({ default: false })

withDefaults(defineProps<{ disabled?: boolean }>(), { disabled: false })
</script>
