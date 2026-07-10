<template>
  <button
    :type="type"
    :disabled="disabled"
    class="inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap font-medium transition disabled:cursor-not-allowed disabled:opacity-50"
    :class="[sizeClass, paddingClass, variantClass, iconOnly && widthClass, iconSizeClass]"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
export type AppButtonSize = 'sm' | 'md' | 'lg'
export type AppButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-ghost'

const props = withDefaults(
  defineProps<{
    size?: AppButtonSize
    variant?: AppButtonVariant
    /** Square button sized for a single icon, no label. Pair with aria-label. */
    iconOnly?: boolean
    disabled?: boolean
    type?: 'button' | 'submit' | 'reset'
  }>(),
  {
    size: 'md',
    variant: 'primary',
    iconOnly: false,
    disabled: false,
    type: 'button',
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

// Icon-only buttons have no label competing for space, so their icon can run
// a size step larger than the same size paired with text — smaller renders
// (e.g. size-3.5) lose fine detail on busier icons like ZoomIn. shrink-0 keeps
// the icon at that size instead of flexbox squeezing it to fit leftover space.
const iconSizeClass = computed(() => {
  if (props.iconOnly) {
    return { sm: '[&_svg]:size-4 [&_svg]:shrink-0', md: '[&_svg]:size-4 [&_svg]:shrink-0', lg: '[&_svg]:size-5 [&_svg]:shrink-0' }[props.size]
  }
  return { sm: '[&_svg]:size-3.5 [&_svg]:shrink-0', md: '[&_svg]:size-3.5 [&_svg]:shrink-0', lg: '[&_svg]:size-4 [&_svg]:shrink-0' }[props.size]
})

const variantClass = computed(() => ({
  primary:
    'bg-[var(--color-accent)] text-[var(--color-on-accent)] enabled:hover:bg-[var(--color-accent-hover)]',
  secondary:
    'border-strong bg-[var(--color-surface-3)] text-[var(--color-text)] enabled:hover:bg-[var(--color-surface-4)]',
  ghost:
    'text-[var(--color-text-muted)] enabled:hover:bg-overlay/5 enabled:hover:text-[var(--color-text)]',
  danger:
    'bg-[var(--color-danger)] text-[var(--color-on-accent)] enabled:hover:opacity-90',
  'danger-ghost':
    'text-[var(--color-danger)] enabled:hover:bg-[var(--color-danger)]/10',
}[props.variant]))
</script>
