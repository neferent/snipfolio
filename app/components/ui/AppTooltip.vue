<template>
  <span
    ref="triggerRef"
    class="contents"
    @mouseover="onMouseOver"
    @mouseout="onMouseOut"
    @focusin="scheduleShow"
    @focusout="hide"
  >
    <slot />
  </span>

  <Teleport to="body">
    <Transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="visible"
        role="tooltip"
        aria-hidden="true"
        class="fixed z-[100] pointer-events-none whitespace-nowrap rounded-md border-strong bg-[var(--color-surface-4)] px-2 py-1 text-xs text-[var(--color-text)] shadow-lg"
        :style="style"
      >
        {{ text }}
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    text: string
    placement?: 'top' | 'bottom' | 'left' | 'right'
    delay?: number
  }>(),
  { placement: 'bottom', delay: 400 },
)

const triggerRef = ref<HTMLElement>()
const visible = ref(false)
const style = ref<Record<string, string>>({})
let timer: ReturnType<typeof setTimeout> | undefined

function getTrigger() {
  return triggerRef.value?.firstElementChild as HTMLElement | null
}

function position() {
  const el = getTrigger()
  if (!el) return

  const rect = el.getBoundingClientRect()
  const gap = 6

  switch (props.placement) {
    case 'top':
      style.value = { left: `${rect.left + rect.width / 2}px`, top: `${rect.top - gap}px`, transform: 'translate(-50%, -100%)' }
      break
    case 'bottom':
      style.value = { left: `${rect.left + rect.width / 2}px`, top: `${rect.bottom + gap}px`, transform: 'translate(-50%, 0)' }
      break
    case 'left':
      style.value = { left: `${rect.left - gap}px`, top: `${rect.top + rect.height / 2}px`, transform: 'translate(-100%, -50%)' }
      break
    case 'right':
      style.value = { left: `${rect.right + gap}px`, top: `${rect.top + rect.height / 2}px`, transform: 'translate(0, -50%)' }
      break
  }
}

function scheduleShow() {
  clearTimeout(timer)
  timer = setTimeout(() => {
    position()
    visible.value = true
  }, props.delay)
}

function hide() {
  clearTimeout(timer)
  visible.value = false
}

function onMouseOver(e: MouseEvent) {
  if (triggerRef.value?.contains(e.relatedTarget as Node)) return
  scheduleShow()
}

function onMouseOut(e: MouseEvent) {
  if (triggerRef.value?.contains(e.relatedTarget as Node)) return
  hide()
}

onBeforeUnmount(() => clearTimeout(timer))
</script>
