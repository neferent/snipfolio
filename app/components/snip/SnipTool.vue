<template>
  <div class="absolute inset-0 flex flex-col bg-[var(--color-surface)]">
    <!-- No sources yet: full-area dropzone -->
    <div v-if="sources.length === 0" class="flex flex-1 items-center justify-center">
      <div class="flex flex-col items-center gap-3">
        <p class="text-sm text-[var(--color-text-muted)]">Drop a screenshot to get started</p>
        <ScreenshotDropzone
          @loaded="(img, src, filename) => onFirstImageLoaded(img, src, filename)"
        />
        <button
          v-if="URL_CAPTURE_ENABLED"
          class="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] transition hover:text-[var(--color-text)]"
          @click="showUrlCapture = true"
        >
          Or capture from a URL
          <span class="rounded px-1.5 py-0.5 text-[10px] font-semibold bg-[var(--color-accent)]/20 text-[var(--color-accent)]">Pro</span>
        </button>
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
          <div class="relative min-w-0 flex-1">
            <div v-if="tabCanScrollLeft" class="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[var(--color-surface-2)] to-transparent z-10" />
            <div v-if="tabCanScrollRight" class="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[var(--color-surface-2)] to-transparent z-10" />
          <div ref="tabScroll" class="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" @wheel.prevent="onTabWheel" @scroll="onTabScroll">
          <div class="flex items-center gap-1 w-max">
            <div
              v-for="source in sources"
              :key="source.id"
              class="group flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition-colors"
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
              <span class="ml-0.5 font-mono text-[10px] text-[var(--color-text-muted)]">
                {{ source.width }}×{{ source.height }}
              </span>
              <span
                class="ml-1 rounded p-0.5 opacity-0 transition group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-400"
                role="button"
                title="Remove source"
                @click.stop="removeSource(source.id)"
              >
                <X class="size-3" />
              </span>
            </div>
          </div>
          </div>
          </div>

          <div class="self-stretch w-px bg-[var(--color-border)] shrink-0" />
          <button
            class="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs text-[var(--color-text-muted)] transition hover:bg-white/5 hover:text-[var(--color-text)]"
            @click="showAddSource = true"
          >
            <Plus class="size-3.5" />
            Add source
          </button>
        </div>

        <!-- Viewport toolbar -->
        <div class="flex h-9 shrink-0 items-center gap-px border-b border-[var(--color-border)] bg-[var(--color-surface-2)] px-2">
          <!-- Active tool: Draw -->
          <AppTooltip text="Draw snip (click and drag)">
            <button
              class="flex size-7 items-center justify-center rounded bg-[var(--color-accent)]/15 text-[var(--color-accent)]"
              aria-label="Draw snip"
              aria-pressed="true"
            >
              <Crop class="size-3.5" aria-hidden="true" />
            </button>
          </AppTooltip>

          <div class="flex-1" />

          <!-- Grid controls -->
          <GridControls />
          <div class="mx-1 h-5 w-px shrink-0 bg-[var(--color-border)]" aria-hidden="true" />

          <!-- Zoom controls -->
          <AppTooltip text="Zoom out">
            <button v-bind="tbBtn()" aria-label="Zoom out" @click="zoom = Math.max(0.05, zoom - 0.1)">
              <ZoomOut class="size-3.5" aria-hidden="true" />
            </button>
          </AppTooltip>
          <input
            class="!h-7 w-16 rounded bg-[var(--color-surface-3)] px-1.5 py-0.5 text-center font-mono text-xs text-[var(--color-text)] outline-none ring-inset focus:ring-1 focus:ring-[var(--color-accent)]"
            aria-label="Zoom level"
            :value="zoomLabel"
            @focus="($event.target as HTMLInputElement).select()"
            @keydown.enter.prevent="onSnipZoomCommit($event)"
            @keydown.escape="($event.target as HTMLInputElement).blur()"
            @blur="($event.target as HTMLInputElement).value = zoomLabel"
          />
          <AppTooltip text="Zoom in">
            <button v-bind="tbBtn()" aria-label="Zoom in" @click="zoom = Math.min(8, zoom + 0.1)">
              <ZoomIn class="size-3.5" aria-hidden="true" />
            </button>
          </AppTooltip>
          <AppTooltip text="Fit to width (Cmd+0)">
            <button v-bind="tbBtn()" aria-label="Fit to width" @click="fitToWidth">
              <Maximize2 class="size-3.5" aria-hidden="true" />
            </button>
          </AppTooltip>

          <!-- Export -->
          <AppTooltip text="Export">
            <AppDropdown align="right">
              <template #trigger>
                <button v-bind="tbBtn()" aria-label="Export">
                  <ArrowUpFromLine class="size-3.5" aria-hidden="true" />
                </button>
              </template>
              <AppDropdownItem @click="showExportPicker = true">Export compositions…</AppDropdownItem>
              <AppDropdownItem @click="exportAllSnipsRaw">Export all snips (raw)</AppDropdownItem>
            </AppDropdown>
          </AppTooltip>
        </div>

        <!-- Scrollable source image viewport -->
        <div
          ref="viewport"
          class="relative flex-1 overflow-auto"
          :class="isPanning ? 'cursor-grabbing' : spacePressed ? 'cursor-grab' : activeImage ? 'cursor-crosshair' : ''"
          @mousedown="onMouseDown"
        >
          <!-- Source not yet loaded -->
          <div
            v-if="!activeImage && !isActiveSourceLoading"
            class="flex h-full items-center justify-center"
          >
            <ScreenshotDropzone @loaded="(img, src) => onImageLoaded(activeSourceId!, img, src)" />
          </div>

          <Transition name="fade">
          <div
            v-if="activeImage"
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
              :draw-snap-guide-v="drawSnapGuideV"
              :draw-snap-guide-h="drawSnapGuideH"
              :image-width="activeImage.img.naturalWidth"
              :image-height="activeImage.img.naturalHeight"
            />
            <!-- Pan capture overlay (shown when Space is held) -->
            <div
              v-if="spacePressed"
              class="absolute inset-0 z-50"
              @mousedown.stop="onPanMouseDown"
            />
          </div>
          </Transition>
        </div>
      </div>

      <!-- Right panel -->
      <SnipPanel />
    </div>

    <!-- Export picker modal -->
    <ExportPickerModal :open="showExportPicker" @close="showExportPicker = false" />

    <!-- URL capture modal -->
    <UrlCaptureModal
      :open="showUrlCapture"
      @close="showUrlCapture = false"
      @loaded="(img, src, filename) => { showUrlCapture = false; showAddSource = false; onFirstImageLoaded(img, src, filename) }"
      @batch-loaded="(items) => { showUrlCapture = false; showAddSource = false; onBatchLoaded(items) }"
    />

    <!-- Add source modal -->
    <AppModal :open="showAddSource" title="Add source image" @close="showAddSource = false">
      <div class="flex flex-col gap-4">
        <div>
          <label for="add-source-label" class="mb-1.5 block text-xs font-medium text-[var(--color-text-muted)]">Label</label>
          <input
            id="add-source-label"
            v-model="newSourceLabel"
            class="w-full"
            placeholder="e.g. Mobile, Desktop"
            @keydown.enter="pendingFile && commitAddSource()"
          />
        </div>
        <div>
          <label class="mb-1.5 block text-xs font-medium text-[var(--color-text-muted)]">Screenshot</label>
          <ScreenshotDropzone @loaded="onPendingImageLoaded" />
          <button
            v-if="URL_CAPTURE_ENABLED"
            class="mt-2 flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] transition hover:text-[var(--color-text)]"
            @click="showUrlCapture = true"
          >
            Or capture from a URL
            <span class="rounded px-1.5 py-0.5 text-[10px] font-semibold bg-[var(--color-accent)]/20 text-[var(--color-accent)]">Pro</span>
          </button>
          <p v-if="pendingFile" class="mt-2 text-xs text-emerald-400">
            ✓ {{ pendingFile.filename }} ({{ pendingFile.img.naturalWidth }}×{{ pendingFile.img.naturalHeight }})
          </p>
        </div>
      </div>
      <template #footer>
        <button
          class="flex h-8 items-center rounded-[6px] px-4 text-sm text-[var(--color-text-muted)] transition hover:bg-white/5"
          @click="cancelAddSource"
        >
          Cancel
        </button>
        <button
          class="flex h-8 items-center rounded-[6px] bg-[var(--color-accent)] px-4 text-sm font-medium transition hover:bg-[var(--color-accent-hover)] hover:text-[var(--color-text)] disabled:opacity-40 text-[var(--color-on-accent)]"
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
import { Crop, ZoomIn, ZoomOut, Maximize2, ArrowUpFromLine, X, Plus } from 'lucide-vue-next'
import { useProjectStore } from '~/stores/project'
import { useSnipsStore } from '~/stores/snips'
import { useSourcesStore } from '~/stores/sources'
import { useSnips } from '~/composables/useSnips'
import { useExport } from '~/composables/useExport'
import { useGridSettingsStore } from '~/stores/gridSettings'
import { snapToGrid } from '~/utils/grid'
import { collectSnapLines, snapEdge } from '~/utils/snapping'
import type { SourceImage } from '~/types'

const projectStore = useProjectStore()
const snipsStore = useSnipsStore()
const sourcesStore = useSourcesStore()
const gridSettings = useGridSettingsStore()
const { createSnip, deleteSnip } = useSnips()
const { exportAllSnipsRaw } = useExport()
const showExportPicker = ref(false)
const { saveImage, deleteImage, deleteSourceRecord, savePreview, scheduleSave } = useProject()

const viewport = ref<HTMLElement>()
const imageContainer = ref<HTMLElement>()
const imgEl = ref<HTMLImageElement>()
const tabScroll = ref<HTMLElement>()
const tabCanScrollLeft = ref(false)
const tabCanScrollRight = ref(false)

function onTabScroll() {
  const el = tabScroll.value
  if (!el) return
  tabCanScrollLeft.value = el.scrollLeft > 0
  tabCanScrollRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 1
}

function onTabWheel(e: WheelEvent) {
  if (tabScroll.value) {
    tabScroll.value.scrollLeft += e.deltaY + e.deltaX
    onTabScroll()
  }
}

const zoom = ref(1)
const zoomLabel = computed(() => Math.round(zoom.value * 100) + '%')

const TB_BASE = 'size-7 flex items-center justify-center rounded text-[var(--color-text-muted)] transition-colors hover:bg-white/10 hover:text-[var(--color-text)]'
function tbBtn() { return { class: TB_BASE } }

function onSnipZoomCommit(e: KeyboardEvent) {
  const raw = (e.target as HTMLInputElement).value.replace('%', '').trim()
  const pct = parseFloat(raw)
  if (!isNaN(pct) && pct > 0) zoom.value = pct / 100
  ;(e.target as HTMLInputElement).blur()
}

const sources = computed(() => sourcesStore.orderedSources)
watch(() => sources.value.length, () => nextTick(onTabScroll))
const activeSourceId = computed(() => sourcesStore.activeSourceId)
const activeImage = computed(() => sourcesStore.activeImage)
const isActiveSourceLoading = computed(() => sourcesStore.isActiveSourceLoading)

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
const showUrlCapture = ref(false)
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


function onBatchLoaded(items: Array<{ img: HTMLImageElement; src: string; filename: string }>) {
  if (!projectStore.current || items.length === 0) return
  for (let i = 0; i < items.length; i++) {
    const { img, src, filename } = items[i]!
    const sourceId = crypto.randomUUID()
    const source: SourceImage = {
      id: sourceId,
      projectId: projectStore.current.id,
      label: filename.replace(/\.[^.]+$/, ''),
      filename,
      width: img.naturalWidth,
      height: img.naturalHeight,
      sortOrder: i,
    }
    sourcesStore.addSource(source)
    sourcesStore.setLoadedImage(sourceId, img, src)
    if (i === 0) {
      sourcesStore.setActiveSource(sourceId)
      savePreview(projectStore.current.id, img)
    }
    saveImage(projectStore.current.id, sourceId, src)
  }
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
  if (projectStore.current) {
    deleteImage(projectStore.current.id, id)
    deleteSourceRecord(projectStore.current.id, id)
  }
  scheduleSave()
}

// --- Space + pan ---
const spacePressed = ref(false)
const isPanning = ref(false)
let pan: { startX: number; startY: number; scrollLeft: number; scrollTop: number } | null = null

function onPanMouseDown(e: MouseEvent) {
  if (e.button !== 0) return
  e.preventDefault()
  const vp = viewport.value
  if (!vp) return
  isPanning.value = true
  pan = { startX: e.clientX, startY: e.clientY, scrollLeft: vp.scrollLeft, scrollTop: vp.scrollTop }
  window.addEventListener('mousemove', onPanMove)
  window.addEventListener('mouseup', onPanUp)
}

function onPanMove(e: MouseEvent) {
  if (!pan) return
  const vp = viewport.value
  if (!vp) return
  vp.scrollLeft = pan.scrollLeft - (e.clientX - pan.startX)
  vp.scrollTop = pan.scrollTop - (e.clientY - pan.startY)
}

function onPanUp() {
  pan = null
  isPanning.value = false
  window.removeEventListener('mousemove', onPanMove)
  window.removeEventListener('mouseup', onPanUp)
}

// --- Zoom (Cmd/Ctrl/Alt+scroll, toward cursor) ---
function onViewportWheel(e: WheelEvent) {
  if (!e.metaKey && !e.ctrlKey && !e.altKey) return
  e.preventDefault()
  const vp = viewport.value
  if (!vp) return

  // Normalize across deltaMode: 0=pixels, 1=lines (~40px), 2=pages (~800px)
  let delta = e.deltaY
  if (e.deltaMode === 1) delta *= 40
  else if (e.deltaMode === 2) delta *= 800

  const oldZoom = zoom.value
  const newZoom = Math.max(0.05, Math.min(8, oldZoom * Math.exp(-delta / 300)))
  if (newZoom === oldZoom) return

  const vpRect = vp.getBoundingClientRect()
  const cursorInViewX = e.clientX - vpRect.left
  const cursorInViewY = e.clientY - vpRect.top
  const imgX = (vp.scrollLeft + cursorInViewX) / oldZoom
  const imgY = (vp.scrollTop + cursorInViewY) / oldZoom

  zoom.value = newZoom

  nextTick(() => {
    vp.scrollLeft = imgX * newZoom - cursorInViewX
    vp.scrollTop = imgY * newZoom - cursorInViewY
  })
}

// --- Keyboard shortcuts ---
function onKeyDown(e: KeyboardEvent) {
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

  if (e.key === ' ') {
    e.preventDefault()
    spacePressed.value = true
    return
  }

  const meta = e.metaKey || e.ctrlKey

  if (e.key === 'Escape') {
    snipsStore.selectSnip(null)
    return
  }

  if (e.key === 'Tab') {
    e.preventDefault()
    const snips = snipsStore.orderedSnips
    if (!snips.length) return
    const idx = snipsStore.selectedSnipId ? snips.findIndex((s) => s.id === snipsStore.selectedSnipId) : -1
    const next = e.shiftKey
      ? snips[(idx - 1 + snips.length) % snips.length]!
      : snips[(idx + 1) % snips.length]!
    snipsStore.selectSnip(next.id)
    return
  }

  if ((e.key === 'Delete' || e.key === 'Backspace') && snipsStore.selectedSnipId) {
    e.preventDefault()
    deleteSnip(snipsStore.selectedSnipId)
    return
  }

  if (meta && e.key === '0') {
    e.preventDefault()
    fitToWidth()
    return
  }

  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key) && snipsStore.selectedSnipId) {
    e.preventDefault()
    const step = e.shiftKey ? 10 : 1
    const snip = snipsStore.selectedSnip
    if (!snip) return
    const patch: Partial<typeof snip> = {}
    if (e.key === 'ArrowLeft') patch.x = snip.x - step
    if (e.key === 'ArrowRight') patch.x = snip.x + step
    if (e.key === 'ArrowUp') patch.y = snip.y - step
    if (e.key === 'ArrowDown') patch.y = snip.y + step
    snipsStore.updateSnip(snipsStore.selectedSnipId, patch)
    return
  }
}

function onKeyUp(e: KeyboardEvent) {
  if (e.key === ' ') spacePressed.value = false
}

function onViewportMiddleDown(e: MouseEvent) {
  if (e.button !== 1) return
  e.preventDefault()
  const vp = viewport.value
  if (!vp) return
  isPanning.value = true
  pan = { startX: e.clientX, startY: e.clientY, scrollLeft: vp.scrollLeft, scrollTop: vp.scrollTop }
  window.addEventListener('mousemove', onPanMove)
  window.addEventListener('mouseup', onPanUp)
}

let _viewportEl: HTMLElement | null = null

onMounted(() => {
  nextTick(onTabScroll)
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  _viewportEl = viewport.value ?? null
  // Use capture phase so snip @mousedown.stop doesn't block these
  _viewportEl?.addEventListener('wheel', onViewportWheel, { passive: false, capture: true })
  _viewportEl?.addEventListener('mousedown', onViewportMiddleDown, { capture: true })
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
  window.removeEventListener('mousemove', onPanMove)
  window.removeEventListener('mouseup', onPanUp)
  _viewportEl?.removeEventListener('wheel', onViewportWheel, { capture: true } as EventListenerOptions)
  _viewportEl?.removeEventListener('mousedown', onViewportMiddleDown, { capture: true } as EventListenerOptions)
})

// --- Draw logic ---
const isDrawing = ref(false)

interface DrawRect { x: number; y: number; w: number; h: number }
const drawRect = ref<DrawRect | null>(null)
const snapFrame = ref<'laptop' | 'phone' | 'tablet' | null>(null)
const drawSnapGuideV = ref<number | null>(null)
const drawSnapGuideH = ref<number | null>(null)
let drawStart: { x: number; y: number } | null = null

const OBJECT_SNAP_PX = 8
const SNAP_THRESHOLD = 0.20
const MIN_SNAP_PX = 60
const LAPTOP_RATIO = 3034.7 / 1964.07 // matches laptop3.svg screen dimensions
const PHONE_RATIO = 709.65 / 1539.77 // matches mobile.svg screen dimensions
const TABLET_RATIO = 750 / 955 // matches TabletFrame.ts screen dimensions (portrait)

function detectSnap(w: number, h: number): 'laptop' | 'phone' | 'tablet' | null {
  if (w < MIN_SNAP_PX || h < MIN_SNAP_PX) return null
  const ratio = w / h
  if (ratio >= LAPTOP_RATIO * (1 - SNAP_THRESHOLD) && ratio <= LAPTOP_RATIO * (1 + SNAP_THRESHOLD)) return 'laptop'
  if (ratio >= PHONE_RATIO * (1 - SNAP_THRESHOLD) && ratio <= PHONE_RATIO * (1 + SNAP_THRESHOLD)) return 'phone'
  if (ratio >= TABLET_RATIO * (1 - SNAP_THRESHOLD) && ratio <= TABLET_RATIO * (1 + SNAP_THRESHOLD)) return 'tablet'
  return null
}

function toImageCoords(e: MouseEvent): { x: number; y: number } {
  const rect = imageContainer.value!.getBoundingClientRect()
  return {
    x: (e.clientX - rect.left) / zoom.value,
    y: (e.clientY - rect.top) / zoom.value,
  }
}

function otherSnipRects() {
  return snipsStore.orderedSnips
    .filter((s) => s.sourceImageId === activeSourceId.value)
    .map((s) => ({ x: s.x, y: s.y, w: s.width, h: s.height }))
}

const SCROLL_ZONE = 60
const SCROLL_SPEED = 12

function edgeVelocity(mouse: number, start: number, end: number): number {
  if (mouse < start + SCROLL_ZONE) return -Math.ceil(Math.min(1, (start + SCROLL_ZONE - mouse) / SCROLL_ZONE) * SCROLL_SPEED)
  if (mouse > end - SCROLL_ZONE) return Math.ceil(Math.min(1, (mouse - (end - SCROLL_ZONE)) / SCROLL_ZONE) * SCROLL_SPEED)
  return 0
}

function onMouseDown(e: MouseEvent) {
  if (!activeImage.value || e.button !== 0 || spacePressed.value) return
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

    const detected = detectSnap(rawW, rawH)
    snapFrame.value = detected

    let endX = cur.x
    let endY = cur.y

    if (detected) {
      drawSnapGuideV.value = null
      drawSnapGuideH.value = null
      let snappedW = rawW
      let snappedH = rawH
      if (detected === 'laptop') snappedH = rawW / LAPTOP_RATIO
      else if (detected === 'phone') snappedW = rawH * PHONE_RATIO
      else if (detected === 'tablet') snappedW = rawH * TABLET_RATIO
      endX = cur.x < drawStart.x ? drawStart.x - snappedW : drawStart.x + snappedW
      endY = cur.y < drawStart.y ? drawStart.y - snappedH : drawStart.y + snappedH
    } else {
      let snappedXEdge = false
      let snappedYEdge = false

      if (gridSettings.snapToObjects) {
        const targets = collectSnapLines(otherSnipRects(), { width: img.naturalWidth, height: img.naturalHeight })
        const threshold = OBJECT_SNAP_PX / zoom.value
        const resX = snapEdge(endX, targets.vertical, threshold)
        if (resX.line !== null) { endX = resX.value; snappedXEdge = true; drawSnapGuideV.value = resX.line }
        else drawSnapGuideV.value = null
        const resY = snapEdge(endY, targets.horizontal, threshold)
        if (resY.line !== null) { endY = resY.value; snappedYEdge = true; drawSnapGuideH.value = resY.line }
        else drawSnapGuideH.value = null
      } else {
        drawSnapGuideV.value = null
        drawSnapGuideH.value = null
      }

      if (gridSettings.snapEnabled) {
        if (!snappedXEdge) endX = snapToGrid(endX, gridSettings.gridSize)
        if (!snappedYEdge) endY = snapToGrid(endY, gridSettings.gridSize)
      }
    }

    drawRect.value = {
      x: Math.min(drawStart.x, endX),
      y: Math.min(drawStart.y, endY),
      w: Math.abs(endX - drawStart.x),
      h: Math.abs(endY - drawStart.y),
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
    const snap = snapFrame.value
    drawRect.value = null
    drawStart = null
    snapFrame.value = null
    drawSnapGuideV.value = null
    drawSnapGuideH.value = null

    if (!rect || rect.w < 10 || rect.h < 10) return
    createSnip(rect.x, rect.y, rect.w, rect.h, snap)
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
