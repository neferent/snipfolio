<template>
  <Listbox v-model="model" as="div" class="relative" :disabled="disabled">
    <ListboxButton
      class="flex w-full items-center justify-between border-strong bg-[var(--color-surface)] pr-8 font-sans text-[var(--color-text)] outline-none transition focus:border-[var(--color-accent)] focus:ring-3 focus:ring-[var(--color-accent-dim)] disabled:cursor-not-allowed disabled:opacity-55"
      :class="sizeClass"
    >
      <span class="truncate">{{ selectedLabel }}</span>
    </ListboxButton>

    <ChevronDown class="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-[var(--color-text-faint)]" />

    <Transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <ListboxOptions class="absolute z-30 mt-1 flex w-full flex-col gap-0.5 p-1.5 focus:outline-none bg-[var(--color-surface-3)] border-strong rounded-lg">
        <ListboxOption
          v-for="option in options"
          :key="String(option.value)"
          v-slot="{ active, selected }"
          :value="option.value"
          as="template"
        >
          <li
            class="flex cursor-pointer items-center rounded-md px-2.5 py-1.5 text-[13px] text-[var(--color-text)] transition"
            :class="active && 'bg-overlay/8'"
          >
            <span class="truncate" :class="selected && 'font-medium'">{{ option.label }}</span>
          </li>
        </ListboxOption>
      </ListboxOptions>
    </Transition>
  </Listbox>
</template>

<script setup lang="ts">
import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/vue'
import { ChevronDown } from 'lucide-vue-next'

export type AppSelectSize = 'sm' | 'md' | 'lg'
export type AppSelectOption = { value: string | number, label: string }

const model = defineModel<string | number>()

const props = withDefaults(
  defineProps<{
    options: AppSelectOption[]
    size?: AppSelectSize
    disabled?: boolean
  }>(),
  {
    size: 'md',
    disabled: false,
  },
)

const selectedLabel = computed(() => props.options.find(o => o.value === model.value)?.label ?? '')

const sizeClass = computed(() => ({
  sm: 'h-7 rounded-sm pl-2.5 text-[12px]',
  md: 'h-8 rounded-md pl-3',
  lg: 'h-10 rounded-lg pl-3.5 text-sm',
}[props.size]))
</script>
