<template>
  <!-- All snip overlays rendered relative to source image -->
  <div class="pointer-events-none absolute inset-0">
    <div
      v-for="snip in snips"
      :key="snip.id"
      class="group absolute cursor-move"
      :style="overlayStyle(snip)"
      class="[pointer-events:all]"
      @mousedown.stop="startMove($event, snip)"
    >
      <!-- Fill + border as single element -->
      <div
        class="absolute inset-0 transition-colors"
        :style="
          resizingSnipId === snip.id && resizeSnapFrame
            ? 'border:2px solid #34d399;background:rgba(52,211,153,0.10);border-radius:3px'
            : snip.id === selectedId
              ? 'border:2px solid #8e9ead;background:rgba(142,158,173,0.14);border-radius:3px'
              : 'border:1.5px solid rgba(142,158,173,0.75);background:rgba(142,158,173,0.08);border-radius:3px'
        "
      />

      <!-- Snap label during resize -->
      <div
        v-if="resizingSnipId === snip.id && resizeSnapFrame"
        class="absolute inset-0 flex items-center justify-center"
      >
        <span class="rounded-full bg-emerald-500/80 px-3 py-1 text-xs font-medium tracking-wide text-white">
          {{ resizeSnapFrame === 'laptop' ? 'Desktop' : resizeSnapFrame === 'tablet' ? 'Tablet' : 'Mobile' }}
        </span>
      </div>

      <!-- Label badge — top-left, bottom-right radius only -->
      <div
        class="absolute left-0 top-0 max-w-[80%] truncate px-1.5 py-0.5"
        class="bg-[var(--color-accent)] text-[var(--color-on-accent)] text-[10px] font-medium font-mono [border-radius:0_0_4px_0]"
      >
        {{ snip.label }}
      </div>

      <!-- Frame type badge — bottom-left, hidden during resize snap -->
      <div
        v-if="snip.snapFrame && !(resizingSnipId === snip.id && resizeSnapFrame)"
        class="absolute bottom-0 left-0 select-none px-1.5 py-0.5"
        :style="frameBadgeStyle(snip.snapFrame)"
      >
        {{ snip.snapFrame === 'laptop' ? 'Desktop' : snip.snapFrame === 'tablet' ? 'Tablet' : 'Mobile' }}
      </div>

      <!-- Drag grip — center, visible on hover -->
      <div class="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-60">
        <GripHorizontal class="size-4 drop-shadow text-white" />
      </div>

      <!-- Rotate button — top-right, hover only, phone/tablet only -->
      <button
        v-if="snip.snapFrame === 'phone' || snip.snapFrame === 'tablet'"
        class="absolute right-1 top-1 flex size-[18px] items-center justify-center rounded opacity-0 transition-opacity group-hover:opacity-100 hover:opacity-100"
        class="bg-black/55 text-white [pointer-events:all]"
        title="Rotate orientation"
        aria-label="Rotate orientation"
        @mousedown.stop
        @click.stop="rotateSnip(snip)"
      >
        <RotateCw class="size-2.5" aria-hidden="true" />
      </button>

      <!-- Resize handles (selected only) — 8×8px per spec -->
      <template v-if="snip.id === selectedId">
        <div
          v-for="handle in handles"
          :key="handle.cursor"
          class="absolute"
          :style="[handle.style, 'width:8px;height:8px;border-radius:2px;background:#8e9ead;border:1.5px solid #111316;pointer-events:all;cursor:' + handle.cursor]"
          @mousedown.stop="startResize($event, snip, handle.dir)"
        />
      </template>
    </div>

    <!-- Active draw selection box -->
    <div
      v-if="drawRect"
      class="absolute"
      :style="[drawRectStyle, snapFrame
        ? 'border:2px solid #34d399;background:rgba(52,211,153,0.10);border-radius:3px'
        : 'border:2px dashed #8e9ead;background:rgba(142,158,173,0.10);border-radius:3px']"
    >
      <!-- Snap frame label -->
      <div
        v-if="snapFrame"
        class="absolute inset-0 flex items-center justify-center"
      >
        <span class="rounded-full bg-emerald-500/80 px-3 py-1 text-xs font-medium tracking-wide text-white">
          {{ snapFrame === 'laptop' ? 'Desktop' : snapFrame === 'tablet' ? 'Tablet' : 'Mobile' }}
        </span>
      </div>

      <div
        class="absolute -bottom-6 left-0 whitespace-nowrap rounded-[4px] px-1.5 py-0.5 text-[10px]"
        class="bg-[var(--color-surface-3)] text-[var(--color-accent)] font-mono border-strong"
      >
        {{ Math.round(drawRect.w) }} × {{ Math.round(drawRect.h) }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { GripHorizontal, RotateCw } from 'lucide-vue-next'
import { useSnipsStore } from '~/stores/snips'
import { useSourcesStore } from '~/stores/sources'
import type { Snip } from '~/types'

const props = defineProps<{
  zoom: number
  drawRect: { x: number; y: number; w: number; h: number } | null
  snapFrame: 'laptop' | 'phone' | 'tablet' | null
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
    let dx = (ev.clientX - startX) / props.zoom
    let dy = (ev.clientY - startY) / props.zoom
    if (!moved && Math.abs(dx) < 2 && Math.abs(dy) < 2) return
    moved = true
    if (ev.shiftKey) {
      if (Math.abs(dx) >= Math.abs(dy)) dy = 0
      else dx = 0
    }
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
  return {
    left: `${r.x}px`,
    top: `${r.y}px`,
    width: `${r.w}px`,
    height: `${r.h}px`,
  }
})

const SNAP_THRESHOLD = 0.20
const MIN_SNAP_PX = 60
const LAPTOP_RATIO = 3034.7 / 1964.07
const PHONE_RATIO = 9 / 16
const TABLET_RATIO = 750 / 955

function detectSnap(w: number, h: number): 'laptop' | 'phone' | 'tablet' | null {
  if (w < MIN_SNAP_PX || h < MIN_SNAP_PX) return null
  const ratio = w / h
  if (ratio >= LAPTOP_RATIO * (1 - SNAP_THRESHOLD) && ratio <= LAPTOP_RATIO * (1 + SNAP_THRESHOLD)) return 'laptop'
  if (ratio >= PHONE_RATIO * (1 - SNAP_THRESHOLD) && ratio <= PHONE_RATIO * (1 + SNAP_THRESHOLD)) return 'phone'
  if (ratio >= TABLET_RATIO * (1 - SNAP_THRESHOLD) && ratio <= TABLET_RATIO * (1 + SNAP_THRESHOLD)) return 'tablet'
  return null
}

const resizingSnipId = ref<string | null>(null)
const resizeSnapFrame = ref<'laptop' | 'phone' | 'tablet' | null>(null)

const handles = [
  { dir: 'nw', cursor: 'nw-resize', style: { top: '-4px', left: '-4px' } },
  { dir: 'n',  cursor: 'n-resize',  style: { top: '-4px', left: 'calc(50% - 4px)' } },
  { dir: 'ne', cursor: 'ne-resize', style: { top: '-4px', right: '-4px' } },
  { dir: 'e',  cursor: 'e-resize',  style: { top: 'calc(50% - 4px)', right: '-4px' } },
  { dir: 'se', cursor: 'se-resize', style: { bottom: '-4px', right: '-4px' } },
  { dir: 's',  cursor: 's-resize',  style: { bottom: '-4px', left: 'calc(50% - 4px)' } },
  { dir: 'sw', cursor: 'sw-resize', style: { bottom: '-4px', left: '-4px' } },
  { dir: 'w',  cursor: 'w-resize',  style: { top: 'calc(50% - 4px)', left: '-4px' } },
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
    const fromCenter = ev.altKey
    const lockAspect = ev.shiftKey && isCorner
    const cx = orig.x + orig.w / 2
    const cy = orig.y + orig.h / 2

    if (fromCenter) {
      if (dir.includes('e')) w = Math.max(20, orig.w + 2 * dx)
      if (dir.includes('s')) h = Math.max(20, orig.h + 2 * dy)
      if (dir.includes('w')) w = Math.max(20, orig.w - 2 * dx)
      if (dir.includes('n')) h = Math.max(20, orig.h - 2 * dy)
      if (dir.includes('e') || dir.includes('w')) x = cx - w / 2
      if (dir.includes('n') || dir.includes('s')) y = cy - h / 2
    } else {
      if (dir.includes('e')) w = Math.max(20, orig.w + dx)
      if (dir.includes('s')) h = Math.max(20, orig.h + dy)
      if (dir.includes('w')) { x = orig.x + dx; w = Math.max(20, orig.w - dx) }
      if (dir.includes('n')) { y = orig.y + dy; h = Math.max(20, orig.h - dy) }
    }

    const detected = (isCorner && !lockAspect) ? detectSnap(w, h) : null
    resizeSnapFrame.value = detected
    if (detected === 'laptop') {
      const newH = w / LAPTOP_RATIO
      if (dir.includes('n')) y = fromCenter ? cy - newH / 2 : orig.y + orig.h - newH
      h = newH
    } else if (detected === 'phone') {
      const newW = h * (9 / 16)
      if (dir.includes('w')) x = fromCenter ? cx - newW / 2 : orig.x + orig.w - newW
      w = newW
    } else if (detected === 'tablet') {
      const newW = h * TABLET_RATIO
      if (dir.includes('w')) x = fromCenter ? cx - newW / 2 : orig.x + orig.w - newW
      w = newW
    }

    if (lockAspect) {
      const ratio = orig.w / orig.h
      if (Math.abs(dx / orig.w) >= Math.abs(dy / orig.h)) {
        h = Math.max(20, w / ratio)
        if (dir.includes('n')) y = fromCenter ? cy - h / 2 : orig.y + orig.h - h
      } else {
        w = Math.max(20, h * ratio)
        if (dir.includes('w')) x = fromCenter ? cx - w / 2 : orig.x + orig.w - w
      }
    }

    if (fromCenter) {
      if (x < 0) { w += x; x = 0 }
      if (y < 0) { h += y; y = 0 }
      if (x + w > props.imageWidth) w = props.imageWidth - x
      if (y + h > props.imageHeight) h = props.imageHeight - y
    } else {
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

function rotateSnip(snip: Snip) {
  const cx = snip.x + snip.width / 2
  const cy = snip.y + snip.height / 2
  const newW = snip.height
  const newH = snip.width
  const x = Math.round(Math.max(0, Math.min(cx - newW / 2, props.imageWidth - newW)))
  const y = Math.round(Math.max(0, Math.min(cy - newH / 2, props.imageHeight - newH)))
  store.updateSnip(snip.id, { x, y, width: newW, height: newH })
  scheduleSave()
}

function frameBadgeStyle(snapFrame: 'laptop' | 'phone' | 'tablet') {
  const map: Record<string, string> = {
    laptop: 'background:rgba(14,165,233,0.28);color:#7dd3fc',
    tablet: 'background:rgba(20,184,166,0.28);color:#5eead4',
    phone:  'background:rgba(139,92,246,0.28);color:#c4b5fd',
  }
  return map[snapFrame] + ';font-size:9px;font-weight:500;border-radius:0 4px 0 0'
}
</script>
