<template>
  <span
    class="inline-flex h-5 shrink-0 items-center gap-1 rounded-sm px-2 text-[11px] font-semibold tracking-[0.01em]"
    :class="variantClass"
  >
    <slot />
  </span>
</template>

<script setup lang="ts">
export type AppBadgeVariant = 'neutral' | 'accent' | 'success' | 'warning' | 'danger'

const props = withDefaults(defineProps<{ variant?: AppBadgeVariant }>(), { variant: 'neutral' })

const variantClass = computed(() => ({
  neutral: 'bg-[var(--color-surface-3)] text-[var(--color-text-muted)]',
  accent: 'bg-[var(--color-accent-dim)] text-[var(--color-accent)]',
  success: 'bg-[var(--color-success)]/15 text-[var(--color-success)]',
  warning: 'bg-[var(--color-warning)]/15 text-[var(--color-warning)]',
  danger: 'bg-[var(--color-danger)]/15 text-[var(--color-danger)]',
}[props.variant]))
</script>
