<template>
  <div class="absolute inset-0 flex flex-col bg-[var(--color-surface)]">
    <!-- Top toolbar (only once at least one image is loaded) -->
    <div
      v-if="sources.length > 0"
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
        <AppDropdownItem @click="showExportPicker = true">Export compositions…</AppDropdownItem>
        <AppDropdownItem @click="exportAllSnipsRaw">Export all snips (raw)</AppDropdownItem>
      </AppDropdown>
    </div>

    <!-- No sources yet: full-area dropzone -->
    <div v-if="sources.length === 0" class="flex flex-1 items-center justify-center">
      <div class="flex flex-col items-center gap-3">
        <p class="text-sm text-[var(--color-text-muted)]">Drop a screenshot to get started</p>
        <ScreenshotDropzone @loaded="(img, src, filename) => onFirstImageLoaded(img, src, filename)" />
      </div>
    </div>

    <!-- Sources loaded: sidebars + viewport -->
    <div v-else class="flex min-h-0 flex-1">
      <!-- Left sidebar -->
      <SnipList />

      <!-- Center: source tabs + scrollable viewport -->
      <div class="flex min-w-0 flex-1 flex-col">
        <!-- Source tab bar -->
        <div class="flex shrink-0 items-center gap-1 border-b border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 py-1.5">
          <div
            v-for="source in sources"
            :key="source.id"
            class="group flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition-colors"
            :class="
              source.id === activeSourceId
                ? 'bg-[var(--color-accent)]/15 text-[var(--color-text)]'
                : 'text-[var(--color-text-muted)] hover:bg-white/5 hover:text-[var(--color-text)]'
            "
            @click="sourcesStore.setActiveSource(source.id)"
          >
            <input
              :value="source.label"
              class="max-w-28 cursor-pointer truncate bg-transparent font-medium outline-none focus:cursor-text"
              title="Click to rename"
              @click.stop
              @focus="sourcesStore.setActiveSource(source.id); onSourceLabelFocus(source.id)"
              @blur="onSourceLabelBlur(source.id, $event)"
              @keydown.stop="onSourceLabelKeydown(source.id, $event)"
            />
            <span class="ml-0.5 text-[10px] text-[var(--color-text-muted)]">
              {{ source.width }}×{{ source.height }}
            </span>
            <span
              class="ml-1 rounded p-0.5 opacity-0 transition group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-400"
              role="button"
              title="Remove source"
              @click.stop="removeSource(source.id)"
            >
              <svg class="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </span>
          </div>

          <button
            class="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-[var(--color-text-muted)] transition hover:bg-white/5 hover:text-[var(--color-text)]"
            @click="showAddSource = true"
          >
            <svg class="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add source
          </button>
        </div>

        <!-- Scrollable source image viewport -->
        <div
          ref="viewport"
          class="relative flex-1 overflow-auto"
          :class="activeImage ? 'cursor-crosshair' : ''"
          @mousedown="onMouseDown"
        >
          <!-- Source not yet loaded -->
          <div
            v-if="!activeImage"
            class="flex h-full items-center justify-center"
          >
            <ScreenshotDropzone @loaded="(img, src) => onImageLoaded(activeSourceId!, img, src)" />
          </div>

          <div
            v-else
            ref="imageContainer"
            class="relative origin-top-left"
            :style="{
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
              width: activeImage.img.naturalWidth + 'px',
              height: activeImage.img.naturalHeight + 'px',
            }"
          >
            <img
              ref="imgEl"
              :src="activeImage.src"
              class="block max-w-none select-none"
              draggable="false"
            />
            <SnipOverlay
              :zoom="zoom"
              :draw-rect="drawRect"
              :snap-frame="snapFrame"
              :image-width="activeImage.img.naturalWidth"
              :image-height="activeImage.img.naturalHeight"
            />
          </div>
        </div>
      </div>

      <!-- Right panel -->
      <SnipPanel />
    </div>

    <!-- Export picker modal -->
    <ExportPickerModal :open="showExportPicker" @close="showExportPicker = false" />

    <!-- Add source modal -->
    <AppModal :open="showAddSource" title="Add source image" @close="showAddSource = false">
      <div class="flex flex-col gap-4">
        <div>
          <label class="mb-1.5 block text-xs font-medium text-[var(--color-text-muted)]">Label</label>
          <input
            v-model="newSourceLabel"
            class="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
            placeholder="e.g. Mobile, Desktop"
            @keydown.enter="pendingFile && commitAddSource()"
          />
        </div>
        <div>
          <label class="mb-1.5 block text-xs font-medium text-[var(--color-text-muted)]">Screenshot</label>
          <ScreenshotDropzone @loaded="onPendingImageLoaded" />
          <p v-if="pendingFile" class="mt-2 text-xs text-emerald-400">
            ✓ {{ pendingFile.filename }} ({{ pendingFile.img.naturalWidth }}×{{ pendingFile.img.naturalHeight }})
          </p>
        </div>
      </div>
      <template #footer>
        <button
          class="rounded-lg px-4 py-2 text-sm text-[var(--color-text-muted)] transition hover:bg-white/5"
          @click="cancelAddSource"
        >
          Cancel
        </button>
        <button
          class="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-accent-hover)] disabled:opacity-40"
          :disabled="!pendingFile || !newSourceLabel.trim()"
          @click="commitAddSource"
        >
          Add source
        </button>
      </template>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { useProjectStore } from '~/stores/project'
import { useSnipsStore } from '~/stores/snips'
import { useSourcesStore } from '~/stores/sources'
import { useSnips } from '~/composables/useSnips'
import { useExport } from '~/composables/useExport'
import type { SourceImage } from '~/types'

const projectStore = useProjectStore()
const snipsStore = useSnipsStore()
const sourcesStore = useSourcesStore()
const { createSnip } = useSnips()
const { exportAllSnipsRaw } = useExport()
const showExportPicker = ref(false)
const { saveImage, deleteImage, savePreview, scheduleSave } = useProject()

const viewport = ref<HTMLElement>()
const imageContainer = ref<HTMLElement>()
const imgEl = ref<HTMLImageElement>()
const zoom = ref(1)

const sources = computed(() => sourcesStore.orderedSources)
const activeSourceId = computed(() => sourcesStore.activeSourceId)
const activeImage = computed(() => sourcesStore.activeImage)

// --- Source tab renaming ---
const sourceLabelOriginals = new Map<string, string>()

function onSourceLabelFocus(id: string) {
  const source = sourcesStore.sources.find((s) => s.id === id)
  if (source) sourceLabelOriginals.set(id, source.label)
}

function onSourceLabelBlur(id: string, e: FocusEvent) {
  const trimmed = (e.target as HTMLInputElement).value.trim()
  if (trimmed) {
    sourcesStore.updateSource(id, { label: trimmed })
    scheduleSave()
  }
  sourceLabelOriginals.delete(id)
}

function onSourceLabelKeydown(id: string, e: KeyboardEvent) {
  if (e.key === 'Enter') {
    ;(e.target as HTMLInputElement).blur()
  } else if (e.key === 'Escape') {
    const original = sourceLabelOriginals.get(id)
    if (original !== undefined) sourcesStore.updateSource(id, { label: original })
    ;(e.target as HTMLInputElement).blur()
  }
}

// --- Add source modal ---
const showAddSource = ref(false)
const newSourceLabel = ref('')
const pendingFile = ref<{ img: HTMLImageElement; src: string; filename: string } | null>(null)

function onPendingImageLoaded(img: HTMLImageElement, src: string, filename: string) {
  pendingFile.value = { img, src, filename }
  if (!newSourceLabel.value.trim()) {
    newSourceLabel.value = filename.replace(/\.[^.]+$/, '')
  }
}

function cancelAddSource() {
  showAddSource.value = false
  newSourceLabel.value = ''
  pendingFile.value = null
}

function commitAddSource() {
  if (!pendingFile.value || !newSourceLabel.value.trim() || !projectStore.current) return
  const { img, src } = pendingFile.value
  const sourceId = crypto.randomUUID()
  const newSource: SourceImage = {
    id: sourceId,
    projectId: projectStore.current.id,
    label: newSourceLabel.value.trim(),
    filename: `source_${Date.now()}`,
    width: img.naturalWidth,
    height: img.naturalHeight,
    sortOrder: sourcesStore.sources.length,
  }
  sourcesStore.addSource(newSource)
  sourcesStore.setLoadedImage(sourceId, img, src)
  sourcesStore.setActiveSource(sourceId)
  saveImage(projectStore.current.id, sourceId, src)
  scheduleSave()
  cancelAddSource()
  nextTick(fitToWidth)
}

function onFirstImageLoaded(img: HTMLImageElement, src: string, filename: string) {
  if (!projectStore.current) return
  const sourceId = crypto.randomUUID()
  const baseName = filename.replace(/\.[^.]+$/, '')
  const source: SourceImage = {
    id: sourceId,
    projectId: projectStore.current.id,
    label: baseName,
    filename: filename,
    width: img.naturalWidth,
    height: img.naturalHeight,
    sortOrder: 0,
  }
  sourcesStore.addSource(source)
  sourcesStore.setLoadedImage(sourceId, img, src)
  sourcesStore.setActiveSource(sourceId)
  saveImage(projectStore.current.id, sourceId, src)
  savePreview(projectStore.current.id, img)
  scheduleSave()
  nextTick(fitToWidth)
}

function onImageLoaded(sourceId: string, img: HTMLImageElement, src: string) {
  if (!projectStore.current) return
  sourcesStore.setLoadedImage(sourceId, img, src)
  sourcesStore.updateSource(sourceId, { width: img.naturalWidth, height: img.naturalHeight })
  saveImage(projectStore.current.id, sourceId, src)
  nextTick(fitToWidth)
}

function removeSource(id: string) {
  snipsStore.snips
    .filter((s) => s.sourceImageId === id)
    .forEach((s) => snipsStore.removeSnip(s.id))
  sourcesStore.removeSource(id)
  if (projectStore.current) deleteImage(projectStore.current.id, id)
  scheduleSave()
}

// --- Draw logic ---
const isDrawing = ref(false)

interface DrawRect { x: number; y: number; w: number; h: number }
const drawRect = ref<DrawRect | null>(null)
const snapFrame = ref<'laptop' | 'phone' | null>(null)
let drawStart: { x: number; y: number } | null = null

const SNAP_THRESHOLD = 0.20
const MIN_SNAP_PX = 60
const LAPTOP_RATIO = 3034.7 / 1964.07 // matches laptop3.svg screen dimensions
const PHONE_RATIO = 709.65 / 1539.77 // matches mobile.svg screen dimensions

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

const SCROLL_ZONE = 60
const SCROLL_SPEED = 12

function edgeVelocity(mouse: number, start: number, end: number): number {
  if (mouse < start + SCROLL_ZONE) return -Math.ceil(Math.min(1, (start + SCROLL_ZONE - mouse) / SCROLL_ZONE) * SCROLL_SPEED)
  if (mouse > end - SCROLL_ZONE) return Math.ceil(Math.min(1, (mouse - (end - SCROLL_ZONE)) / SCROLL_ZONE) * SCROLL_SPEED)
  return 0
}

function onMouseDown(e: MouseEvent) {
  if (!activeImage.value || e.button !== 0) return
  e.preventDefault()
  const img = activeImage.value.img
  const raw = toImageCoords(e)
  drawStart = {
    x: Math.max(0, Math.min(raw.x, img.naturalWidth)),
    y: Math.max(0, Math.min(raw.y, img.naturalHeight)),
  }
  drawRect.value = { x: drawStart.x, y: drawStart.y, w: 0, h: 0 }
  isDrawing.value = true

  let lastEv = e

  function applyMove(ev: MouseEvent) {
    if (!drawStart) return
    const cur = toImageCoords(ev)
    cur.x = Math.max(0, Math.min(cur.x, img.naturalWidth))
    cur.y = Math.max(0, Math.min(cur.y, img.naturalHeight))

    const rawW = Math.abs(cur.x - drawStart.x)
    const rawH = Math.abs(cur.y - drawStart.y)
    const anchorRight = cur.x < drawStart.x
    const anchorBottom = cur.y < drawStart.y

    const detected = detectSnap(rawW, rawH)
    snapFrame.value = detected

    let snappedW = rawW
    let snappedH = rawH
    if (detected === 'laptop') snappedH = rawW / LAPTOP_RATIO
    else if (detected === 'phone') snappedW = rawH * PHONE_RATIO

    drawRect.value = {
      x: anchorRight ? drawStart.x - snappedW : drawStart.x,
      y: anchorBottom ? drawStart.y - snappedH : drawStart.y,
      w: snappedW,
      h: snappedH,
    }
  }

  let rafId = 0
  function scrollLoop() {
    if (viewport.value) {
      const vp = viewport.value.getBoundingClientRect()
      const vx = edgeVelocity(lastEv.clientX, vp.left, vp.right)
      const vy = edgeVelocity(lastEv.clientY, vp.top, vp.bottom)
      if (vx !== 0 || vy !== 0) {
        viewport.value.scrollBy(vx, vy)
        applyMove(lastEv)
      }
    }
    rafId = requestAnimationFrame(scrollLoop)
  }
  rafId = requestAnimationFrame(scrollLoop)

  function onMove(ev: MouseEvent) {
    lastEv = ev
    applyMove(ev)
  }

  function onUp() {
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
    cancelAnimationFrame(rafId)
    isDrawing.value = false

    const rect = drawRect.value
    drawRect.value = null
    drawStart = null
    snapFrame.value = null

    if (!rect || rect.w < 10 || rect.h < 10) return
    createSnip(rect.x, rect.y, rect.w, rect.h)
  }

  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}

function fitToWidth() {
  if (!viewport.value || !activeImage.value) return
  zoom.value = viewport.value.clientWidth / activeImage.value.img.naturalWidth
}

function fitToHeight() {
  if (!viewport.value || !activeImage.value) return
  zoom.value = viewport.value.clientHeight / activeImage.value.img.naturalHeight
}
</script>
