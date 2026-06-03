<template>
  <div class="absolute inset-0 flex flex-col bg-[var(--color-surface)]">
    <!-- Top toolbar (only once image is loaded) -->
    <div
      v-if="sourceImage"
      class="flex shrink-0 items-center gap-3 border-b border-[var(--color-border)] px-4 py-2"
    >
      <ZoomControls
        v-model="zoom"
        @fit-width="fitToWidth"
        @fit-height="fitToHeight"
      />
      <div class="flex-1" />
      <AppDropdown align="right">
        <template #trigger>
          <button
            class="flex items-center gap-1.5 rounded-lg bg-[var(--color-accent)] px-3 py-1.5 text-sm font-medium text-white transition hover:bg-[var(--color-accent-hover)]"
          >
            Export
            <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 17l4 4 4-4m-4-12v16" />
            </svg>
          </button>
        </template>
        <AppDropdownItem @click="exportAllCompositions">Export all compositions</AppDropdownItem>
        <AppDropdownItem @click="exportAllSnipsRaw">Export all snips (raw)</AppDropdownItem>
      </AppDropdown>
    </div>

    <!-- No image yet: full-area dropzone (no sidebars) -->
    <div v-if="!sourceImage" class="flex flex-1 items-center justify-center">
      <ScreenshotDropzone @loaded="onImageLoaded" />
    </div>

    <!-- Image loaded: sidebars + scrollable viewport -->
    <div v-else class="flex min-h-0 flex-1">
      <!-- Left sidebar -->
      <SnipList />

      <!-- Scrollable source image viewport -->
      <div
        ref="viewport"
        class="relative flex-1 overflow-auto"
        :class="isDrawing ? 'cursor-crosshair' : 'cursor-crosshair'"
        @mousedown="onMouseDown"
        @mousemove="onMouseMove"
        @mouseup="onMouseUp"
      >
        <div
          ref="imageContainer"
          class="relative origin-top-left"
          :style="{
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            width: sourceImage.naturalWidth + 'px',
            height: sourceImage.naturalHeight + 'px',
          }"
        >
          <img
            ref="imgEl"
            :src="sourceImageSrc"
            class="block max-w-none select-none"
            draggable="false"
          />
          <SnipOverlay :zoom="zoom" :draw-rect="drawRect" :snap-frame="snapFrame" />
        </div>
      </div>

      <!-- Right panel -->
      <SnipPanel />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useProjectStore } from '~/stores/project'
import { useSnipsStore } from '~/stores/snips'
import { useSnips } from '~/composables/useSnips'
import { useExport } from '~/composables/useExport'

const projectStore = useProjectStore()
const snipsStore = useSnipsStore()
const { createSnip } = useSnips()
const { exportAllCompositions, exportAllSnipsRaw } = useExport()
const { saveImage } = useProject()

const viewport = ref<HTMLElement>()
const imageContainer = ref<HTMLElement>()
const imgEl = ref<HTMLImageElement>()
const zoom = ref(1)
const sourceImage = computed(() => projectStore.sourceImage)
const sourceImageSrc = computed(() => projectStore.sourceImageSrc ?? '')

const isDrawing = ref(false)

interface DrawRect { x: number; y: number; w: number; h: number }
const drawRect = ref<DrawRect | null>(null)
const snapFrame = ref<'laptop' | 'phone' | null>(null)
let drawStart: { x: number; y: number } | null = null
let isMouseDown = false

const SNAP_THRESHOLD = 0.20
const MIN_SNAP_PX = 60
const LAPTOP_RATIO = 16 / 9
const PHONE_RATIO = 9 / 16

function detectSnap(w: number, h: number): 'laptop' | 'phone' | null {
  if (w < MIN_SNAP_PX || h < MIN_SNAP_PX) return null
  const ratio = w / h
  if (ratio >= LAPTOP_RATIO * (1 - SNAP_THRESHOLD) && ratio <= LAPTOP_RATIO * (1 + SNAP_THRESHOLD)) return 'laptop'
  if (ratio >= PHONE_RATIO * (1 - SNAP_THRESHOLD) && ratio <= PHONE_RATIO * (1 + SNAP_THRESHOLD)) return 'phone'
  return null
}

function toImageCoords(e: MouseEvent): { x: number; y: number } {
  const rect = imageContainer.value!.getBoundingClientRect()
  return {
    x: (e.clientX - rect.left) / zoom.value,
    y: (e.clientY - rect.top) / zoom.value,
  }
}

function onMouseDown(e: MouseEvent) {
  if (!sourceImage.value || e.button !== 0) return
  isMouseDown = true
  drawStart = toImageCoords(e)
  drawRect.value = { x: drawStart.x, y: drawStart.y, w: 0, h: 0 }
  isDrawing.value = true
}

function onMouseMove(e: MouseEvent) {
  if (!isMouseDown || !drawStart) return
  const cur = toImageCoords(e)

  const rawW = Math.abs(cur.x - drawStart.x)
  const rawH = Math.abs(cur.y - drawStart.y)
  const anchorRight = cur.x < drawStart.x
  const anchorBottom = cur.y < drawStart.y

  const detected = detectSnap(rawW, rawH)
  snapFrame.value = detected

  let snappedW = rawW
  let snappedH = rawH
  if (detected === 'laptop') snappedH = rawW * (9 / 16)
  else if (detected === 'phone') snappedW = rawH * (9 / 16)

  drawRect.value = {
    x: anchorRight ? drawStart.x - snappedW : drawStart.x,
    y: anchorBottom ? drawStart.y - snappedH : drawStart.y,
    w: snappedW,
    h: snappedH,
  }
}

function onMouseUp() {
  if (!isMouseDown || !drawStart || !drawRect.value) {
    isMouseDown = false
    return
  }
  isMouseDown = false
  isDrawing.value = false

  const { x, y, w, h } = drawRect.value
  drawRect.value = null
  drawStart = null
  snapFrame.value = null

  if (w < 10 || h < 10) return
  createSnip(x, y, w, h)
}

function onImageLoaded(img: HTMLImageElement, src: string) {
  projectStore.setSourceImage(img, src)
  if (projectStore.current) saveImage(projectStore.current.id, src)
  nextTick(fitToWidth)
}

function fitToWidth() {
  if (!viewport.value || !sourceImage.value) return
  zoom.value = viewport.value.clientWidth / sourceImage.value.naturalWidth
}

function fitToHeight() {
  if (!viewport.value || !sourceImage.value) return
  zoom.value = viewport.value.clientHeight / sourceImage.value.naturalHeight
}
</script>
