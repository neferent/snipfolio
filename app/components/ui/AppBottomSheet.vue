<template>
  <Teleport to="body">
    <Transition
      enter-active-class="duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-40 bg-black/40"
        @click="$emit('close')"
      />
    </Transition>

    <div
      v-if="open"
      ref="sheetEl"
      class="fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-2xl border-t border-[var(--color-border)] bg-[var(--color-surface-2)] shadow-2xl"
      :style="sheetStyle"
      @touchstart.passive="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
    >
      <div class="flex shrink-0 items-center justify-center py-2">
        <div class="h-1 w-10 rounded-full bg-white/20" />
      </div>

      <div
        v-if="title"
        class="flex shrink-0 items-center justify-between px-4 pb-2"
      >
        <span class="text-sm font-medium text-[var(--color-text)]">{{ title }}</span>
        <button
          class="rounded-md p-1 text-[var(--color-text-muted)] transition hover:bg-white/10"
          aria-label="Close"
          @click="$emit('close')"
        >
          <X class="size-4" />
        </button>
      </div>

      <div
        ref="contentEl"
        class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-safe"
      >
        <slot />
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { X } from 'lucide-vue-next'

type SnapPoint = 'peek' | 'half' | 'full'

const props = withDefaults(defineProps<{
  open: boolean
  title?: string
  snapPoints?: SnapPoint[]
  initialSnap?: SnapPoint
  peekHeight?: number
}>(), {
  snapPoints: () => ['half', 'full'],
  initialSnap: 'half',
  peekHeight: 72,
})

const emit = defineEmits<{
  close: []
  snapChange: [snap: SnapPoint]
}>()

const sheetEl = ref<HTMLElement>()
const contentEl = ref<HTMLElement>()
const currentSnap = ref<SnapPoint>(props.initialSnap)
const dragOffset = ref(0)
const isDragging = ref(false)

let touchStartY = 0
let touchStartTime = 0
let startTranslate = 0

function snapHeight(snap: SnapPoint): number {
  const vh = window.innerHeight
  switch (snap) {
    case 'peek': return props.peekHeight
    case 'half': return vh * 0.5
    case 'full': return vh * 0.9
  }
}

function currentHeight(): number {
  return snapHeight(currentSnap.value)
}

const sheetStyle = computed(() => {
  const h = currentHeight()
  const translateY = isDragging.value ? Math.max(0, dragOffset.value) : 0
  return {
    height: `${h}px`,
    transform: translateY > 0 ? `translateY(${translateY}px)` : undefined,
    transition: isDragging.value ? 'none' : 'height 0.25s ease-out, transform 0.25s ease-out',
  }
})

function onTouchStart(e: TouchEvent) {
  if (e.touches.length !== 1) return
  const scrollTop = contentEl.value?.scrollTop ?? 0
  if (scrollTop > 0) return

  touchStartY = e.touches[0]!.clientY
  touchStartTime = Date.now()
  startTranslate = 0
  isDragging.value = true
  dragOffset.value = 0
}

function onTouchMove(e: TouchEvent) {
  if (!isDragging.value || e.touches.length !== 1) return
  const dy = e.touches[0]!.clientY - touchStartY
  if (dy > 0) {
    e.preventDefault()
    dragOffset.value = dy
  } else {
    const nextSnap = getNextSnapUp()
    if (nextSnap && nextSnap !== currentSnap.value) {
      currentSnap.value = nextSnap
      emit('snapChange', nextSnap)
      isDragging.value = false
      dragOffset.value = 0
    } else {
      isDragging.value = false
      dragOffset.value = 0
    }
  }
}

function onTouchEnd() {
  if (!isDragging.value) return
  isDragging.value = false

  const velocity = dragOffset.value / (Date.now() - touchStartTime)
  const threshold = currentHeight() * 0.3

  if (velocity > 0.5 || dragOffset.value > threshold) {
    const nextDown = getNextSnapDown()
    if (nextDown) {
      currentSnap.value = nextDown
      emit('snapChange', nextDown)
      dragOffset.value = 0
    } else {
      emit('close')
    }
  }
  dragOffset.value = 0
}

function getNextSnapUp(): SnapPoint | null {
  const order: SnapPoint[] = ['peek', 'half', 'full']
  const available = order.filter(s => props.snapPoints.includes(s))
  const idx = available.indexOf(currentSnap.value)
  return idx < available.length - 1 ? available[idx + 1]! : null
}

function getNextSnapDown(): SnapPoint | null {
  const order: SnapPoint[] = ['peek', 'half', 'full']
  const available = order.filter(s => props.snapPoints.includes(s))
  const idx = available.indexOf(currentSnap.value)
  return idx > 0 ? available[idx - 1]! : null
}

watch(() => props.open, (val) => {
  if (val) {
    currentSnap.value = props.initialSnap
    dragOffset.value = 0
    isDragging.value = false
  }
})

watch(() => props.initialSnap, (val) => {
  if (props.open) {
    currentSnap.value = val
  }
})
</script>
