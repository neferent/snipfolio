<template>
  <button
    type="button"
    :disabled="disabled"
    :aria-pressed="model"
    class="inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap border font-medium transition disabled:cursor-not-allowed disabled:opacity-50"
    :class="[sizeClass, paddingClass, iconOnly && widthClass, iconSizeClass, model ? activeClass : inactiveClass]"
    @click="model = !model"
  >
    <component :is="model ? Check : Square" v-if="showCheck" :stroke-width="3" aria-hidden="true" class="shrink-0" />
    <slot />
  </button>
</template>

<script setup lang="ts">
import { Check, Square } from 'lucide-vue-next'

export type AppToggleButtonSize = 'sm' | 'md' | 'lg'
export type AppToggleButtonVariant = 'solid' | 'tint'

const model = defineModel<boolean>({ default: false })

const props = withDefaults(
  defineProps<{
    size?: AppToggleButtonSize
    /** solid: accent fill when pressed (device/segmented toggles). tint: accent-tinted bg when pressed (icon toolbar toggles). */
    variant?: AppToggleButtonVariant
    /** Square button sized for a single icon, no label. Pair with aria-label. */
    iconOnly?: boolean
    disabled?: boolean
  }>(),
  {
    size: 'md',
    variant: 'solid',
    iconOnly: false,
    disabled: false,
  },
)

const sizeClass = computed(() => ({
  sm: 'h-7 rounded-sm text-[12px]',
  md: 'h-8 rounded-md text-xs',
  lg: 'h-10 rounded-lg text-sm',
}[props.size]))

// Single source for horizontal padding so icon-only's 0 can't lose a
// same-specificity fight against the paired-with-text px-* value.
const paddingClass = computed(() => {
  if (props.iconOnly) return 'px-0'
  return { sm: 'px-2.5', md: 'px-3.5', lg: 'px-4.5' }[props.size]
})

const widthClass = computed(() => ({
  sm: 'w-7',
  md: 'w-8',
  lg: 'w-10',
}[props.size]))

// shrink-0 keeps the icon at its set size instead of flexbox squeezing it
// down to fit whatever space is left in the button.
const iconSizeClass = computed(() => {
  if (props.iconOnly) {
    return { sm: '[&_svg]:size-4 [&_svg]:shrink-0', md: '[&_svg]:size-4 [&_svg]:shrink-0', lg: '[&_svg]:size-5 [&_svg]:shrink-0' }[props.size]
  }
  return { sm: '[&_svg]:size-3.5 [&_svg]:shrink-0', md: '[&_svg]:size-3.5 [&_svg]:shrink-0', lg: '[&_svg]:size-4 [&_svg]:shrink-0' }[props.size]
})

// Segmented (solid) pickers show a leading checkmark when active; icon-only
// toolbar toggles (tint) already carry their own icon in the slot.
const showCheck = computed(() => props.variant === 'solid' && !props.iconOnly)

const inactiveClass = 'border-[var(--color-border)] text-[var(--color-text-muted)] enabled:hover:bg-overlay/5 enabled:hover:text-[var(--color-text)]'

const activeClass = computed(() => ({
  solid: 'border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-on-accent)]',
  tint: 'border-transparent bg-[var(--color-accent-dim)] text-[var(--color-accent)]',
}[props.variant]))
</script>
