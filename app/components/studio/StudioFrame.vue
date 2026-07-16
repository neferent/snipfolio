<script setup lang="ts">
import { ref, computed, type CSSProperties } from 'vue'

const props = defineProps<{
  x: number
  y: number
  width: number
  height: number
  scrollOffset: number
  maxScrollOffset: number
  viewScale: number
  svgAspect: number
  selected?: boolean
}>()

const emit = defineEmits<{
  'update:x': [number]
  'update:y': [number]
  'update:width': [number]
  'update:scrollOffset': [number]
}>()

const RING = 52
const HANDLE_SIZE = 10
const THUMB_H = 28

const scrollTrack = ref<HTMLElement | null>(null)
const hovered = ref(false)
const dragging = ref(false)
let leaveTimer: ReturnType<typeof setTimeout> | null = null

function onMouseEnter() {
  if (leaveTimer) { clearTimeout(leaveTimer); leaveTimer = null }
  hovered.value = true
}
function onMouseLeave() {
  if (dragging.value) return
  leaveTimer = setTimeout(() => { hovered.value = false; leaveTimer = null }, 250)
}

const displayW = computed(() => Math.round(props.width * props.viewScale))
const displayH = computed(() => Math.round(props.height * props.viewScale))

function cornerStyle(corner: 'tl' | 'tr' | 'bl' | 'br'): CSSProperties {
  const half = HANDLE_SIZE / 2
  const cursors: Record<string, CSSProperties['cursor']> = { tl: 'nw-resize', tr: 'ne-resize', bl: 'sw-resize', br: 'se-resize' }
  const top = corner.startsWith('t') ? `${RING - half}px` : `${RING + displayH.value - half}px`
  const left = corner.endsWith('l') ? `${RING - half}px` : `${RING + displayW.value - half}px`
  return { position: 'absolute', top, left, width: `${HANDLE_SIZE}px`, height: `${HANDLE_SIZE}px`, cursor: cursors[corner] }
}

const dragBodyStyle = computed((): CSSProperties => ({
  position: 'absolute',
  left: `${RING}px`,
  top: `${RING}px`,
  width: `${displayW.value}px`,
  height: `${displayH.value}px`,
  cursor: 'grab',
}))

const borderStyle = computed((): CSSProperties => ({
  position: 'absolute',
  left: `${RING}px`,
  top: `${RING}px`,
  width: `${displayW.value}px`,
  height: `${displayH.value}px`,
  pointerEvents: 'none',
}))

const scrollTrackStyle = computed((): CSSProperties => ({
  position: 'absolute',
  left: `${RING + displayW.value + 18}px`,
  top: `${RING}px`,
  width: '2px',
  height: `${displayH.value}px`,
}))

const scrollThumbStyle = computed((): CSSProperties => {
  const pct = props.maxScrollOffset > 0 ? props.scrollOffset / props.maxScrollOffset : 0
  const maxTop = displayH.value - THUMB_H
  return {
    position: 'absolute',
    left: '-4px',
    top: `${Math.round(pct * maxTop)}px`,
    width: '10px',
    height: `${THUMB_H}px`,
    cursor: 'ns-resize',
  }
})

function startDrag(e: MouseEvent) {
  const startX = e.clientX
  const startY = e.clientY
  const origX = props.x
  const origY = props.y
  dragging.value = true

  const onMove = (e: MouseEvent) => {
    emit('update:x', origX + (e.clientX - startX) / props.viewScale)
    emit('update:y', origY + (e.clientY - startY) / props.viewScale)
  }
  const onUp = () => {
    dragging.value = false
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}

function startScale(corner: 'tl' | 'tr' | 'bl' | 'br', e: MouseEvent) {
  const startX = e.clientX
  const origW = props.width
  const origH = props.height
  const origX = props.x
  const origY = props.y
  const isRight = corner === 'tr' || corner === 'br'
  const isBottom = corner === 'bl' || corner === 'br'
  dragging.value = true

  const onMove = (e: MouseEvent) => {
    const dx = (e.clientX - startX) / props.viewScale
    const newW = Math.max(80, isRight ? origW + dx : origW - dx)
    const newH = newW / props.svgAspect
    const newX = isRight ? origX : origX + origW - newW
    const newY = isBottom ? origY : origY + origH - newH
    emit('update:width', newW)
    emit('update:x', newX)
    emit('update:y', newY)
  }
  const onUp = () => {
    dragging.value = false
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}

function onWheel(e: WheelEvent) {
  if (props.maxScrollOffset <= 0) return
  e.preventDefault()
  const next = Math.max(0, Math.min(props.maxScrollOffset, props.scrollOffset + e.deltaY))
  emit('update:scrollOffset', next)
}

function startScroll(e: MouseEvent) {
  if (props.maxScrollOffset <= 0) return
  const trackEl = scrollTrack.value
  if (!trackEl) return
  dragging.value = true

  const onMove = (e: MouseEvent) => {
    const rect = trackEl.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))
    emit('update:scrollOffset', pct * props.maxScrollOffset)
  }
  const onUp = () => {
    dragging.value = false
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
  onMove(e)
}
</script>

<template>
  <div
    class="absolute"
    :style="{
      left: `${x * viewScale - RING}px`,
      top: `${y * viewScale - RING}px`,
      width: `${displayW + RING * 2}px`,
      height: `${displayH + RING * 2}px`,
    }"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
    @wheel="onWheel"
  >
    <!-- Controls (hover only) -->
    <template v-if="hovered">
      <!-- Frame border: bright cyan (selected) or dimmer cyan (unselected hover) — chosen to stay
           legible against arbitrary screenshot backgrounds, unlike the muted grey accent color. -->
      <div
        :style="borderStyle"
        class="rounded-[2px]"
        :class="selected ? 'border-2 border-[#22d3ee] shadow-[0_0_0_1px_rgba(0,0,0,0.4)]' : 'border border-[#22d3ee]/50'"
      />

      <!-- Drag anywhere on the frame body -->
      <div
        :style="dragBodyStyle"
        @mousedown.stop.prevent="startDrag($event)"
      />

      <!-- Corner scale handles -->
      <div
        v-for="corner in (['tl', 'tr', 'bl', 'br'] as const)"
        :key="corner"
        :style="cornerStyle(corner)"
        class="rounded-full border-2 border-[#22d3ee] bg-transparent shadow"
        @mousedown.stop.prevent="startScale(corner, $event)"
      />

      <!-- Scroll track + thumb (right side) -->
      <div
        v-if="maxScrollOffset > 0"
        ref="scrollTrack"
        :style="scrollTrackStyle"
        class="rounded-full bg-[#22d3ee]/20"
        @mousedown.stop.prevent="startScroll($event)"
      >
        <div
          :style="scrollThumbStyle"
          class="rounded-full bg-[#22d3ee] shadow-[0_0_0_1px_rgba(0,0,0,0.4)]"
        />
      </div>
    </template>
  </div>
</template>
