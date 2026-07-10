<template>
  <SwitchGroup as="label" class="inline-flex items-center gap-2 text-sm text-[var(--color-text)]" :class="disabled && 'cursor-not-allowed opacity-55'">
    <Switch
      v-model="model"
      :disabled="disabled"
      class="relative inline-flex h-[18px] w-8 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors focus:outline-none focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] focus-visible:outline-offset-2 disabled:cursor-not-allowed"
      :class="model ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-surface-4)]'"
    >
      <span
        class="inline-block size-3.5 shrink-0 rounded-full shadow-sm transition-transform"
        :class="model ? 'translate-x-full bg-[var(--color-on-accent)]' : 'translate-x-0 bg-[var(--color-surface)]'"
      />
    </Switch>
    <SwitchLabel v-if="$slots.default" class="cursor-pointer" :class="disabled && 'cursor-not-allowed'">
      <slot />
    </SwitchLabel>
  </SwitchGroup>
</template>

<script setup lang="ts">
import { Switch, SwitchGroup, SwitchLabel } from '@headlessui/vue'

const model = defineModel<boolean>({ default: false })

withDefaults(defineProps<{ disabled?: boolean }>(), { disabled: false })
</script>
