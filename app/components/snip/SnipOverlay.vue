<template>
  <!-- All snip overlays rendered relative to source image -->
  <div class="pointer-events-none absolute inset-0">
    <div
      v-for="snip in snips"
      :key="snip.id"
      class="absolute cursor-move"
      :style="overlayStyle(snip)"
      style="pointer-events: all"
      @mousedown.stop="startMove($event, snip)"
    >
      <!-- Fill -->
      <div
        class="absolute inset-0 transition-colors"
        :class="
          resizingSnipId === snip.id && resizeSnapFrame
            ? 'bg-emerald-400/15'
            : snip.id === selectedId
              ? 'bg-indigo-500/20'
              : 'bg-indigo-500/10 hover:bg-indigo-500/15'
        "
      />

      <!-- Border -->
      <div
        class="absolute inset-0 border-2 transition-colors"
        :class="
          resizingSnipId === snip.id && resizeSnapFrame
            ? 'border-emerald-400 shadow-[0_0_0_1px_rgba(52,211,153,0.4)]'
            : snip.id === selectedId
              ? 'border-indigo-400'
              : 'border-indigo-400/50'
        "
      />

      <!-- Snap label during resize -->
      <div
        v-if="resizingSnipId === snip.id && resizeSnapFrame"
        class="absolute inset-0 flex items-center justify-center"
      >
        <span class="rounded-full bg-emerald-500/80 px-3 py-1 text-xs font-semibold tracking-wide text-white">
          {{ resizeSnapFrame === 'laptop' ? '💻 Laptop' : '📱 Phone' }}
        </span>
      </div>

      <!-- Label badge -->
      <div
        class="absolute left-1 top-1 max-w-[80%] truncate rounded bg-indigo-500/80 px-1.5 py-0.5 text-[10px] font-medium text-white"
      >
        {{ snip.label }}
      </div>

      <!-- Resize handles (selected only) -->
      <template v-if="snip.id === selectedId">
        <div
          v-for="handle in handles"
          :key="handle.cursor"
          class="absolute size-2.5 rounded-sm border border-white bg-indigo-500"
          :style="handle.style"
          :class="'cursor-' + handle.cursor"
          style="pointer-events: all"
          @mousedown.stop="startResize($event, snip, handle.dir)"
        />
      </template>
    </div>

    <!-- Active draw selection box -->
    <div
      v-if="drawRect"
      class="absolute"
      :class="snapFrame ? 'border-2 border-emerald-400 bg-emerald-400/15 shadow-[0_0_0_1px_rgba(52,211,153,0.4)]' : 'border-2 border-dashed border-indigo-400 bg-indigo-500/20'"
      :style="drawRectStyle"
    >
      <!-- Snap frame label -->
      <div
        v-if="snapFrame"
        class="absolute inset-0 flex items-center justify-center"
      >
        <span class="rounded-full bg-emerald-500/80 px-3 py-1 text-xs font-semibold tracking-wide text-white">
          {{ snapFrame === 'laptop' ? '💻 Laptop' : '📱 Phone' }}
        </span>
      </div>

      <div
        class="absolute -bottom-6 left-0 whitespace-nowrap rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white"
      >
        {{ Math.round(drawRect.w) }} × {{ Math.round(drawRect.h) }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSnipsStore } from '~/stores/snips'
import { useSourcesStore } from '~/stores/sources'
import type { Snip } from '~/types'

const props = defineProps<{
  zoom: number
  drawRect: { x: number; y: number; w: number; h: number } | null
  snapFrame: 'laptop' | 'phone' | null
  imageWidth: number
  imageHeight: number
}>()

const store = useSnipsStore()
const sourcesStore = useSourcesStore()
const { scheduleSave } = useProject()

const snips = computed(() =>
  store.orderedSnips.filter((s) => s.sourceImageId === sourcesStore.activeSourceId),
)
const selectedId = computed(() => store.selectedSnipId)

function overlayStyle(snip: Snip) {
  // Parent imageContainer already applies transform:scale(zoom), so use raw image pixels here
  return {
    left: `${snip.x}px`,
    top: `${snip.y}px`,
    width: `${snip.width}px`,
    height: `${snip.height}px`,
  }
}

function startMove(e: MouseEvent, snip: Snip) {
  if (e.button !== 0) return
  e.preventDefault()
  store.selectSnip(snip.id)

  const startX = e.clientX
  const startY = e.clientY
  const origX = snip.x
  const origY = snip.y
  let moved = false

  function onMove(ev: MouseEvent) {
    const dx = (ev.clientX - startX) / props.zoom
    const dy = (ev.clientY - startY) / props.zoom
    if (!moved && Math.abs(dx) < 2 && Math.abs(dy) < 2) return
    moved = true
    store.updateSnip(snip.id, {
      x: Math.round(Math.max(0, Math.min(origX + dx, props.imageWidth - snip.width))),
      y: Math.round(Math.max(0, Math.min(origY + dy, props.imageHeight - snip.height))),
    })
  }

  function onUp() {
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
    if (moved) scheduleSave()
  }

  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}

const drawRectStyle = computed(() => {
  const r = props.drawRect
  if (!r) return {}
  // drawRect is already in image coordinates; parent transform handles visual scaling
  return {
    left: `${r.x}px`,
    top: `${r.y}px`,
    width: `${r.w}px`,
    height: `${r.h}px`,
  }
})

const SNAP_THRESHOLD = 0.20
const MIN_SNAP_PX = 60
const LAPTOP_RATIO = 3034.7 / 1964.07 // matches laptop3.svg screen dimensions
const PHONE_RATIO = 9 / 16

function detectSnap(w: number, h: number): 'laptop' | 'phone' | null {
  if (w < MIN_SNAP_PX || h < MIN_SNAP_PX) return null
  const ratio = w / h
  if (ratio >= LAPTOP_RATIO * (1 - SNAP_THRESHOLD) && ratio <= LAPTOP_RATIO * (1 + SNAP_THRESHOLD)) return 'laptop'
  if (ratio >= PHONE_RATIO * (1 - SNAP_THRESHOLD) && ratio <= PHONE_RATIO * (1 + SNAP_THRESHOLD)) return 'phone'
  return null
}

const resizingSnipId = ref<string | null>(null)
const resizeSnapFrame = ref<'laptop' | 'phone' | null>(null)

// Resize handle positions
const handles = [
  { dir: 'nw', cursor: 'nw-resize', style: { top: '-5px', left: '-5px' } },
  { dir: 'n', cursor: 'n-resize', style: { top: '-5px', left: 'calc(50% - 5px)' } },
  { dir: 'ne', cursor: 'ne-resize', style: { top: '-5px', right: '-5px' } },
  { dir: 'e', cursor: 'e-resize', style: { top: 'calc(50% - 5px)', right: '-5px' } },
  { dir: 'se', cursor: 'se-resize', style: { bottom: '-5px', right: '-5px' } },
  { dir: 's', cursor: 's-resize', style: { bottom: '-5px', left: 'calc(50% - 5px)' } },
  { dir: 'sw', cursor: 'sw-resize', style: { bottom: '-5px', left: '-5px' } },
  { dir: 'w', cursor: 'w-resize', style: { top: 'calc(50% - 5px)', left: '-5px' } },
]

function startResize(e: MouseEvent, snip: Snip, dir: string) {
  e.preventDefault()
  const startX = e.clientX
  const startY = e.clientY
  const orig = { x: snip.x, y: snip.y, w: snip.width, h: snip.height }
  const z = props.zoom
  const isCorner = dir.length === 2
  resizingSnipId.value = snip.id

  function onMove(ev: MouseEvent) {
    const dx = (ev.clientX - startX) / z
    const dy = (ev.clientY - startY) / z
    let { x, y, w, h } = orig
    if (dir.includes('e')) w = Math.max(20, orig.w + dx)
    if (dir.includes('s')) h = Math.max(20, orig.h + dy)
    if (dir.includes('w')) { x = orig.x + dx; w = Math.max(20, orig.w - dx) }
    if (dir.includes('n')) { y = orig.y + dy; h = Math.max(20, orig.h - dy) }

    const detected = isCorner ? detectSnap(w, h) : null
    resizeSnapFrame.value = detected
    if (detected === 'laptop') {
      const newH = w / LAPTOP_RATIO
      if (dir.includes('n')) y = orig.y + orig.h - newH
      h = newH
    } else if (detected === 'phone') {
      const newW = h * (9 / 16)
      if (dir.includes('w')) x = orig.x + orig.w - newW
      w = newW
    }

    // Clamp to image bounds — keep fixed edges anchored correctly
    if (dir.includes('w')) {
      x = Math.max(0, x)
      w = (orig.x + orig.w) - x
    } else {
      w = Math.min(w, props.imageWidth - orig.x)
    }
    if (dir.includes('n')) {
      y = Math.max(0, y)
      h = (orig.y + orig.h) - y
    } else {
      h = Math.min(h, props.imageHeight - orig.y)
    }
    w = Math.max(20, w)
    h = Math.max(20, h)

    store.updateSnip(snip.id, { x: Math.round(x), y: Math.round(y), width: Math.round(w), height: Math.round(h) })
  }

  function onUp() {
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
    resizingSnipId.value = null
    resizeSnapFrame.value = null
    scheduleSave()
  }

  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}
</script>
