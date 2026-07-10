<template>
  <RadioGroupOption v-slot="{ checked, active, disabled: optionDisabled }" :value="value" :disabled="disabled" as="template">
    <label
      class="inline-flex items-center gap-2 text-sm text-[var(--color-text)]"
      :class="optionDisabled ? 'cursor-not-allowed opacity-55' : 'cursor-pointer'"
    >
      <span
        class="relative flex aspect-square size-4 shrink-0 items-center justify-center rounded-full transition"
        :class="[
          checked ? 'bg-[var(--color-accent)]' : 'border-strong bg-[var(--color-surface)]',
          active && 'outline-2 outline-[var(--color-accent)] outline-offset-2',
        ]"
      >
        <span v-if="checked" class="size-[6px] rounded-full bg-[var(--color-on-accent)]" />
      </span>
      <slot />
    </label>
  </RadioGroupOption>
</template>

<script setup lang="ts">
import { RadioGroupOption } from '@headlessui/vue'

withDefaults(
  defineProps<{
    value: string | number | boolean
    disabled?: boolean
  }>(),
  { disabled: false },
)
</script>
