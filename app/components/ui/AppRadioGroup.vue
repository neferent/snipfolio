<template>
  <RadioGroup v-model="model" as="div" class="contents" :disabled="disabled">
    <slot />
  </RadioGroup>
</template>

<script setup lang="ts">
import { RadioGroup } from '@headlessui/vue'

const model = defineModel<string | number | boolean>()

withDefaults(defineProps<{ disabled?: boolean }>(), { disabled: false })
</script>
