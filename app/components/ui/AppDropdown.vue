<template>
  <Menu as="div" class="relative inline-block text-left">
    <MenuButton as="template">
      <slot name="trigger" />
    </MenuButton>

    <Transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="opacity-0 scale-95 translate-y-1"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="opacity-100 scale-100 translate-y-0"
      leave-to-class="opacity-0 scale-95 translate-y-1"
    >
      <MenuItems
        class="absolute z-30 mt-1 flex min-w-40 flex-col gap-0.5 p-1.5 focus:outline-none"
        class="bg-[var(--color-surface-3)] border-strong rounded-lg"
        :class="alignClass"
      >
        <slot />
      </MenuItems>
    </Transition>
  </Menu>
</template>

<script setup lang="ts">
import { Menu, MenuButton, MenuItems } from '@headlessui/vue'

const props = withDefaults(
  defineProps<{
    align?: 'left' | 'right'
  }>(),
  { align: 'left' },
)

const alignClass = computed(() => (props.align === 'right' ? 'right-0' : 'left-0'))
</script>
