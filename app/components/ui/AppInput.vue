<template>
  <div>
    <div class="relative">
      <input
        ref="inputEl"
        v-bind="$attrs"
        v-model="model"
        :disabled="disabled"
        class="w-full font-sans text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-text-faint)] disabled:cursor-not-allowed disabled:opacity-55"
        :class="[sizeClass, error ? errorClass : defaultClass, $slots.suffix && suffixPadClass]"
      >
      <div v-if="$slots.suffix" class="absolute inset-y-0 right-0 flex items-center px-2.5 text-[var(--color-text-muted)]">
        <slot name="suffix" />
      </div>
    </div>
    <p v-if="typeof error === 'string' && error" class="mt-1.5 text-[11.5px] text-[var(--color-danger)]">
      {{ error }}
    </p>
  </div>
</template>

<script setup lang="ts">
export type AppInputSize = 'sm' | 'md' | 'lg'

defineOptions({ inheritAttrs: false })

const model = defineModel<string | number>()

const props = withDefaults(
  defineProps<{
    size?: AppInputSize
    /** String renders as a message below the field; `true` just marks it invalid. */
    error?: string | boolean
    disabled?: boolean
  }>(),
  {
    size: 'md',
    error: false,
    disabled: false,
  },
)

const sizeClass = computed(() => ({
  sm: 'h-7 rounded-sm px-2.5 text-[12px]',
  md: 'h-8 rounded-md px-3',
  lg: 'h-10 rounded-lg px-3.5 text-sm',
}[props.size]))

const suffixPadClass = computed(() => ({
  sm: 'pr-7',
  md: 'pr-8',
  lg: 'pr-9',
}[props.size]))

const defaultClass =
  'border-strong bg-[var(--color-surface)] focus:border-[var(--color-accent)] focus:ring-3 focus:ring-[var(--color-accent-dim)]'
const errorClass =
  'border-[0.5px] border-[var(--color-danger)] bg-[var(--color-surface)] focus:ring-3 focus:ring-[var(--color-danger)]/10'

const inputEl = ref<HTMLInputElement>()
defineExpose({
  focus: (opts?: FocusOptions) => inputEl.value?.focus(opts),
  select: () => inputEl.value?.select(),
})
</script>
