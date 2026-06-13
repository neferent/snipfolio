<template>
  <div class="absolute inset-0 flex">
    <!-- Left sidebar: slot list (z-order) + add snips -->
    <aside
      class="relative flex shrink-0 flex-col overflow-hidden border-r border-[var(--color-border)] bg-[var(--color-surface-2)]"
      :style="{ width: leftWidth + 'px' }"
    >
      <div class="flex h-10 shrink-0 items-center px-4 border-b-subtle">
        <h2 class="text-[12px] font-medium tracking-wider uppercase text-[var(--color-text-faint)]">Layers</h2>
      </div>

      <div class="flex-1 overflow-y-auto">
        <!-- Slot list (top = front) -->
        <div
          v-if="slots.length > 0"
          class="p-2"
          @dragleave.stop="onListDragLeave"
        >
          <p class="px-2 pb-1 text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
            Slots · top = front
          </p>
          <template v-for="(slot, idx) in displaySlots" :key="slot.id">
            <!-- drop indicator line before this item -->
            <div
              class="mx-1 flex items-center gap-1 py-px transition-opacity duration-100"
              :class="dragOverIdx === idx && dragFromIdx !== idx && dragFromIdx !== idx - 1 ? 'opacity-100' : 'opacity-0 pointer-events-none'"
            >
              <div class="size-1.5 shrink-0 rounded-full bg-[var(--color-accent)]" />
              <div class="h-0.5 flex-1 rounded-full bg-[var(--color-accent)]" />
            </div>
            <div
              draggable="true"
              class="group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition"
              :class="[
                selectedSlotId === slot.id
                  ? 'bg-[var(--color-accent)]/15 text-[var(--color-accent)]'
                  : 'cursor-pointer text-[var(--color-text)] hover:bg-white/5',
                dragSlotId === slot.id ? 'opacity-40' : '',
              ]"
              @click="selectedSlotId = slot.id"
              @dragstart.stop="onDragStart(slot.id)"
              @dragover.prevent.stop="onDragOver($event, idx)"
              @drop.stop="onDrop(dragOverIdx!)"
              @dragend.stop="dragSlotId = null; dragOverIdx = null"
            >
            <!-- drag handle -->
            <GripVertical class="size-3 shrink-0 cursor-grab text-[var(--color-text-muted)] opacity-40 group-hover:opacity-100" />

            <SnipThumbnail :snip="snipFor(slot.snipId)" class="size-7 shrink-0 rounded" />

            <span class="truncate">{{ snipLabel(slot.snipId) }}</span>
            <span v-if="snipFor(slot.snipId).snapFrame === 'laptop'" class="shrink-0 rounded bg-sky-500/20 px-1 py-px text-[9px] font-medium text-sky-400">Desktop</span>
            <span v-else-if="snipFor(slot.snipId).snapFrame === 'tablet'" class="shrink-0 rounded bg-teal-500/20 px-1 py-px text-[9px] font-medium text-teal-400">Tablet</span>
            <span v-else-if="snipFor(slot.snipId).snapFrame === 'phone'" class="shrink-0 rounded bg-violet-500/20 px-1 py-px text-[9px] font-medium text-violet-400">Mobile</span>
            <span class="flex-1" />

            <span
              v-if="frameMismatches.some(m => m.slotId === slot.id)"
              class="mismatch-tip shrink-0"
            >
              <CircleAlert class="size-3 text-amber-400" />
              <span class="mismatch-tip-label">Frame will appear distorted</span>
            </span>

            <button
              class="ml-auto shrink-0 rounded p-0.5 text-[var(--color-text-muted)] opacity-0 transition hover:text-red-400 group-hover:opacity-100"
              @click.stop="removeSlot(slot.id)"
              title="Remove slot"
            >
              <X class="size-3" />
            </button>
            </div>
            <!-- drop indicator line after last item -->
            <div
              v-if="idx === displaySlots.length - 1"
              class="mx-1 flex items-center gap-1 py-px transition-opacity duration-100"
              :class="dragOverIdx === displaySlots.length && dragFromIdx !== displaySlots.length - 1 ? 'opacity-100' : 'opacity-0 pointer-events-none'"
            >
              <div class="size-1.5 shrink-0 rounded-full bg-[var(--color-accent)]" />
              <div class="h-0.5 flex-1 rounded-full bg-[var(--color-accent)]" />
            </div>
          </template>
        </div>

        <div class="border-t border-[var(--color-border)] p-2">
          <p class="px-2 pb-1 text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
            Add snip
          </p>
          <div
            v-for="snip in availableSnips"
            :key="snip.id"
            class="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-[var(--color-text)] transition hover:bg-white/5"
            @click="addSnip(snip)"
          >
            <SnipThumbnail :snip="snip" class="size-7 shrink-0 rounded" />
            <span class="truncate">{{ snip.label }}</span>
            <span v-if="snip.snapFrame === 'laptop'" class="shrink-0 rounded bg-sky-500/20 px-1 py-px text-[9px] font-medium text-sky-400">Desktop</span>
            <span v-else-if="snip.snapFrame === 'tablet'" class="shrink-0 rounded bg-teal-500/20 px-1 py-px text-[9px] font-medium text-teal-400">Tablet</span>
            <span v-else-if="snip.snapFrame === 'phone'" class="shrink-0 rounded bg-violet-500/20 px-1 py-px text-[9px] font-medium text-violet-400">Mobile</span>
            <span v-if="getSnipFrameMismatch(snip)" class="mismatch-tip shrink-0">
              <CircleAlert class="size-3 text-amber-400" />
              <span class="mismatch-tip-label">Aspect ratio no longer matches frame</span>
            </span>
            <Plus class="size-3 shrink-0 text-[var(--color-text-muted)]" />
          </div>
          <p v-if="availableSnips.length === 0" class="px-2 py-2 text-[var(--color-text-muted)]">
            No snips — draw some first
          </p>
        </div>
      </div>

      <!-- Left drag handle -->
      <div
        class="absolute inset-y-0 right-0 z-10 w-1 cursor-col-resize hover:bg-[var(--color-accent)]/40 transition-colors"
        @mousedown="startLeftResize"
      />
    </aside>

    <!-- Center: toolbar + artboard -->
    <div class="flex min-w-0 flex-1 flex-col">
      <ComposerToolbar
        :selected-slot="selectedSlot"
        :zoom="canvasScale"
        @align-left="alignSlot('left')"
        @align-center-h="alignSlot('center-h')"
        @align-right="alignSlot('right')"
        @align-top="alignSlot('top')"
        @align-center-v="alignSlot('center-v')"
        @align-bottom="alignSlot('bottom')"
        @z-forward="selectedSlotId && moveForward(selectedSlotId)"
        @z-back="selectedSlotId && moveBackward(selectedSlotId)"
        @z-front="selectedSlotId && moveToFront(selectedSlotId)"
        @z-bottom="selectedSlotId && moveToBack(selectedSlotId)"
        @delete-slot="selectedSlotId && removeSlot(selectedSlotId)"
        @zoom-change="userZoom = $event"
        @zoom-fit="userZoom = null"
      />

      <div
        ref="canvasContainer"
        class="relative flex-1 overflow-auto bg-[var(--color-surface)]"
        :class="spacePressed ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : ''"
        @mousedown.self="onContainerSelfMouseDown"
      >
        <div class="pointer-events-none absolute bottom-4 left-0 right-0 z-20 flex justify-center">
          <div class="pointer-events-auto">
            <WatermarkToggle />
          </div>
        </div>

        <!-- Frame mismatch overlay (bottom-right, dismissible) -->
        <Transition name="mismatch-fade">
          <div
            v-if="frameMismatches.length > 0 && !mismatchDismissed"
            class="pointer-events-auto absolute bottom-4 right-4 z-20 max-w-[240px] rounded-lg px-[12px] py-[10px] backdrop-blur-sm bg-[rgba(18,20,24,0.92)] shadow-[0_4px_16px_rgba(0,0,0,0.4)] [border:1px_solid_rgba(251,191,36,0.3)]"
          >
            <div class="flex items-center justify-between gap-3 mb-1.5">
              <span class="text-[12px] font-semibold tracking-[0.04em] text-amber-400">Frame mismatch</span>
              <button
                class="shrink-0 leading-none [color:rgba(251,191,36,0.5)] transition hover:text-[#fbbf24]"
                @click="mismatchDismissed = true"
              >
                <X class="size-3" />
              </button>
            </div>
            <ul class="m-0 flex list-none flex-col gap-[3px] p-0">
              <li
                v-for="m in frameMismatches"
                :key="m.slotId"
                class="text-[12px] leading-[1.4] [color:rgba(251,191,36,0.7)]"
              >
                <span class="[color:rgba(251,191,36,0.4)]">{{ m.frameName }}</span>
                {{ m.snipLabel }}
              </li>
            </ul>
            <p class="mt-[6px] text-[10px] leading-[1.4] [color:rgba(251,191,36,0.4)]">
              Frame will appear distorted
            </p>
          </div>
        </Transition>
      <div class="flex min-h-full items-center justify-center p-8">
        <!-- Artboard -->
        <div
          ref="artboard"
          class="relative"
          :style="{
            width: previewW + 'px',
            height: previewH + 'px',
            opacity: resizing ? 0 : 1,
            transition: resizing ? 'none' : 'opacity 175ms linear',
          }"
          @mousedown.self="selectedSlotId = null"
        >
          <!-- Full-composition canvas (background + all slots rendered) -->
          <canvas
            ref="canvas"
            class="pointer-events-none absolute inset-0"
            :style="{ width: previewW + 'px', height: previewH + 'px' }"
          />

          <GridOverlay :visible="gridSettings.showGrid" :size="gridSettings.gridSize * canvasScale" />
          <SnapGuides
            :vertical="snapGuideV !== null ? [snapGuideV * canvasScale] : []"
            :horizontal="snapGuideH !== null ? [snapGuideH * canvasScale] : []"
          />

          <!-- Pan capture overlay (shown when Space is held) -->
          <div
            v-if="spacePressed"
            class="absolute inset-0 z-50"
            @mousedown.stop="onPanMouseDown"
          />

          <!-- Slot interaction overlays (back to front matches z-order) -->
          <div
            v-for="slot in slots"
            :key="slot.id"
            class="absolute"
            :style="overlayStyle(slot)"
            @mousedown.stop="onSlotMouseDown($event, slot)"
          >
            <!-- Selection ring + handles -->
            <template v-if="selectedSlotId === slot.id">
              <div class="pointer-events-none absolute inset-0 rounded-[1px] ring-2 ring-[var(--color-accent)] ring-offset-0" />
              <div class="handle tl" @mousedown.stop="onHandleMouseDown($event, slot, 'tl')" />
              <div class="handle tr" @mousedown.stop="onHandleMouseDown($event, slot, 'tr')" />
              <div class="handle bl" @mousedown.stop="onHandleMouseDown($event, slot, 'bl')" />
              <div class="handle br" @mousedown.stop="onHandleMouseDown($event, slot, 'br')" />
            </template>
          </div>
        </div>
      </div>
    </div>
    </div><!-- end center column -->

    <!-- Right sidebar: slot properties + background + output + export -->
    <aside
      class="relative flex shrink-0 flex-col overflow-y-auto border-l border-[var(--color-border)] bg-[var(--color-surface-2)]"
      :style="{ width: rightWidth + 'px' }"
    >
      <!-- Selected slot controls -->
      <template v-if="selectedSlot">
        <div class="flex h-10 shrink-0 items-center px-4 border-b-subtle">
          <h2 class="text-[12px] font-medium tracking-wider uppercase text-[var(--color-text-faint)]">Slot</h2>
        </div>
        <div class="p-4 space-y-3 border-b-subtle">
          <div class="space-y-2">
            <label class="text-xs font-medium text-[var(--color-text-muted)]">Frame</label>
            <div class="grid grid-cols-2 gap-1.5">
              <button
                v-for="frame in frames"
                :key="frame.value"
                class="py-1.5 text-xs transition"
                :style="selectedSlot.deviceFrame === frame.value
                  ? 'border-radius:6px;border:1.5px solid #8e9ead;background:rgba(142,158,173,0.08);color:#e2e6ea'
                  : 'border-radius:6px;border:0.5px solid rgba(255,255,255,0.06);color:#6b7280'"
                @click="updateSlotFrame(selectedSlot.id, frame.value)"
              >
                {{ frame.label }}
              </button>
            </div>
            <div v-if="selectedSlot.deviceFrame !== 'none'" class="flex items-center gap-2">
              <label class="text-xs text-[var(--color-text-muted)]">Color</label>
              <AppColorPicker
                :model-value="selectedSlot.frameColor ?? '#262c44'"
                @update:model-value="patchSlot(selectedSlot.id, { frameColor: $event })"
              />
              <button
                class="rounded-[6px] text-xs text-[var(--color-text-muted)] transition hover:text-[var(--color-text)]"
                @click="patchSlot(selectedSlot.id, { frameColor: undefined })"
              >
                Reset
              </button>
            </div>
          </div>

          <div class="border-t-subtle pt-3">
            <CaptionControls
              label="Caption"
              :model-value="selectedSlot.caption"
              @update:model-value="patchSlot(selectedSlot.id, { caption: $event })"
            />
          </div>
        </div>
      </template>

      <CompositionSettingsPanel
        :composition="composition"
        :background="config.background"
        :output-width="config.outputWidth"
        :output-height="config.outputHeight"
        :name="composition.name"
        @update:background="updateBackground"
        @update:output-size="setOutputSize"
        @update:name="$emit('update-name', $event)"
        @export="$emit('export')"
      />

      <!-- Right drag handle -->
      <div
        class="absolute inset-y-0 left-0 z-10 w-1 cursor-col-resize hover:bg-[var(--color-accent)]/40 transition-colors"
        @mousedown="startRightResize"
      />
    </aside>
  </div>
</template>

<script setup lang="ts">
import { GripVertical, X, Plus, CircleAlert } from 'lucide-vue-next'
import { useResizablePanel } from '~/composables/useResizablePanel'

const { width: leftWidth, startResize: startLeftResize } = useResizablePanel(224, { side: 'right', min: 150, max: 480 })
const { width: rightWidth, startResize: startRightResize } = useResizablePanel(256, { side: 'left', min: 180, max: 480 })
import { getFrameMismatches, getSnipFrameMismatch } from '~/composables/useFrameMismatches'
import { useElementSize } from '@vueuse/core'
import { useCanvasRenderer } from '~/composables/useCanvasRenderer'
import { useSnipsStore } from '~/stores/snips'
import { useSourcesStore } from '~/stores/sources'
import { useGridSettingsStore } from '~/stores/gridSettings'
import { snapToGrid } from '~/utils/grid'
import { collectSnapLines, snapMove, snapEdge } from '~/utils/snapping'
import { useWatermarkPreview } from '~/composables/useWatermarkPreview'

const OBJECT_SNAP_PX = 8
import type { Composition, FreeformCompositionConfig, FreeformSlotConfig, DeviceFrame, Snip, BackgroundConfig } from '~/types'

const props = defineProps<{
  composition: Composition
}>()

const emit = defineEmits<{
  'update-config': [config: FreeformCompositionConfig]
  'update-name': [name: string]
  'export': []
}>()

const snipsStore = useSnipsStore()
const sourcesStore = useSourcesStore()
const gridSettings = useGridSettingsStore()
const { render } = useCanvasRenderer()
const { active: watermark } = useWatermarkPreview()

const canvas = ref<HTMLCanvasElement>()
const canvasContainer = ref<HTMLElement>()
const artboard = ref<HTMLElement>()

const loadedBgImage = ref<HTMLImageElement | undefined>()

const config = computed(() => props.composition.config as FreeformCompositionConfig)

watch(
  () => config.value.background,
  (bg) => {
    if (bg.type === 'image' && bg.imageDataUrl) {
      const img = new Image()
      img.onload = () => { loadedBgImage.value = img }
      img.src = bg.imageDataUrl
    } else {
      loadedBgImage.value = undefined
    }
  },
  { immediate: true, deep: false },
)

// slots stored back-to-front (index 0 = back). Display reversed so top of list = front.
const slots = computed(() => config.value.slots)
const displaySlots = computed(() => [...slots.value].reverse())

const snapGuideV = ref<number | null>(null)
const snapGuideH = ref<number | null>(null)

function otherSlotRects(slotId: string) {
  return slots.value
    .filter((s) => s.id !== slotId)
    .map((s) => ({ x: s.x, y: s.y, w: s.width, h: s.height }))
}

const { width: containerW, height: containerH } = useElementSize(canvasContainer)

const containerReady = computed(() => containerW.value > 0 && containerH.value > 0)

const canvasScale = computed(() => {
  if (userZoom.value !== null) return userZoom.value
  if (!containerReady.value) return 0
  const pad = 64
  return Math.min(
    (containerW.value - pad) / config.value.outputWidth,
    (containerH.value - pad) / config.value.outputHeight,
    1,
  )
})

const previewW = computed(() => Math.round(config.value.outputWidth * canvasScale.value))
const previewH = computed(() => Math.round(config.value.outputHeight * canvasScale.value))

// Crossfade out/in across discrete output-size changes (and the initial size
// measurement) instead of snapping or stretching the artboard
const resizing = ref(true)
watch([() => config.value.outputWidth, () => config.value.outputHeight, containerReady], async () => {
  resizing.value = true
  await nextTick()
  requestAnimationFrame(() => { resizing.value = false })
})

// --- User zoom override (Cmd+scroll; null = auto-fit) ---
const userZoom = ref<number | null>(null)

const selectedSlotId = ref<string | null>(null)
const selectedSlot = computed(() => slots.value.find((s) => s.id === selectedSlotId.value) ?? null)

const snips = computed(() => snipsStore.orderedSnips)
const availableSnips = computed(() => snipsStore.orderedSnips)

const frames: { value: DeviceFrame; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'phone', label: 'Mobile' },
  { value: 'tablet', label: 'Tablet' },
  { value: 'browser', label: 'Browser' },
  { value: 'laptop', label: 'Desktop' },
]

const frameMismatches = computed(() => getFrameMismatches(props.composition, snipsStore.snips))

const mismatchDismissed = ref(false)
watch(() => frameMismatches.value.length, (n, prev) => {
  if (n > (prev ?? 0)) mismatchDismissed.value = false
})

// --- Helpers ---
function snipFor(snipId: string): Snip {
  return snipsStore.snips.find((s) => s.id === snipId) ?? {
    id: snipId, projectId: '', sourceImageId: '', label: '?', x: 0, y: 0, width: 1, height: 1, sortOrder: 0,
  }
}

function snipLabel(snipId: string): string {
  return snipsStore.snips.find((s) => s.id === snipId)?.label ?? 'Unknown'
}

function overlayStyle(slot: FreeformSlotConfig) {
  return {
    left: Math.round(slot.x * canvasScale.value) + 'px',
    top: Math.round(slot.y * canvasScale.value) + 'px',
    width: Math.round(slot.width * canvasScale.value) + 'px',
    height: Math.round(slot.height * canvasScale.value) + 'px',
    cursor: selectedSlotId.value === slot.id ? 'move' : 'pointer',
  }
}

// --- Config mutations ---
function patchConfig(patch: Partial<FreeformCompositionConfig>) {
  emit('update-config', { ...config.value, ...patch })
}

function patchSlot(slotId: string, patch: Partial<FreeformSlotConfig>) {
  patchConfig({
    slots: slots.value.map((s) => (s.id === slotId ? { ...s, ...patch } : s)),
  })
}

function updateBackground(bg: BackgroundConfig) {
  patchConfig({ background: bg })
}

function setOutputSize(w: number, h: number) {
  patchConfig({ outputWidth: w, outputHeight: h })
}

function updateSlotFrame(slotId: string, deviceFrame: DeviceFrame) {
  patchSlot(slotId, { deviceFrame })
}

function removeSlot(slotId: string) {
  if (selectedSlotId.value === slotId) selectedSlotId.value = null
  patchConfig({ slots: slots.value.filter((s) => s.id !== slotId) })
}

// --- Drag-to-reorder (displaySlots is front-first; slots array is back-first) ---
const dragSlotId = ref<string | null>(null)
const dragOverIdx = ref<number | null>(null)
const dragFromIdx = computed(() =>
  dragSlotId.value ? displaySlots.value.findIndex((s) => s.id === dragSlotId.value) : -1,
)

function onDragStart(slotId: string) {
  dragSlotId.value = slotId
}

function onDragOver(e: DragEvent, idx: number) {
  const el = e.currentTarget as HTMLElement
  const rect = el.getBoundingClientRect()
  dragOverIdx.value = e.clientY < rect.top + rect.height / 2 ? idx : idx + 1
}

function onListDragLeave(e: DragEvent) {
  const list = e.currentTarget as HTMLElement
  if (!list.contains(e.relatedTarget as Node)) {
    dragOverIdx.value = null
  }
}

function onDrop(toDisplayIdx: number) {
  if (!dragSlotId.value || toDisplayIdx === null) return
  const display = [...displaySlots.value]
  const fromIdx = display.findIndex((s) => s.id === dragSlotId.value)
  if (fromIdx === -1) return
  // Adjust index for the gap left by removing the dragged item
  const insertAt = toDisplayIdx > fromIdx ? toDisplayIdx - 1 : toDisplayIdx
  if (insertAt === fromIdx) return
  const [item] = display.splice(fromIdx, 1)
  display.splice(insertAt, 0, item!)
  // displaySlots is front-first; slots array is back-first — reverse to restore storage order
  patchConfig({ slots: [...display].reverse() })
  dragSlotId.value = null
  dragOverIdx.value = null
}

function addSnip(snip: Snip) {
  const oW = config.value.outputWidth
  const oH = config.value.outputHeight
  const aspect = snip.width / snip.height
  const h = oH * 0.5
  const w = h * aspect
  const slot: FreeformSlotConfig = {
    id: crypto.randomUUID(),
    snipId: snip.id,
    deviceFrame: 'none',
    x: Math.round(oW / 2 - w / 2),
    y: Math.round(oH / 2 - h / 2),
    width: Math.round(w),
    height: Math.round(h),
  }
  // Append to end of array = front of z-stack
  patchConfig({ slots: [...slots.value, slot] })
  selectedSlotId.value = slot.id
}

// --- Drag / resize ---
type DragState =
  | { type: 'move'; slotId: string; startMX: number; startMY: number; startX: number; startY: number }
  | { type: 'resize'; slotId: string; corner: 'tl' | 'tr' | 'bl' | 'br'; startMX: number; startMY: number; startX: number; startY: number; startW: number; startH: number }

let drag: DragState | null = null

function onContainerSelfMouseDown() {
  selectedSlotId.value = null
}

function onSlotMouseDown(e: MouseEvent, slot: FreeformSlotConfig) {
  if (spacePressed.value) return
  selectedSlotId.value = slot.id
  drag = {
    type: 'move',
    slotId: slot.id,
    startMX: e.clientX,
    startMY: e.clientY,
    startX: slot.x,
    startY: slot.y,
  }
  e.preventDefault()
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

function onHandleMouseDown(e: MouseEvent, slot: FreeformSlotConfig, corner: 'tl' | 'tr' | 'bl' | 'br') {
  if (spacePressed.value) return
  drag = {
    type: 'resize',
    slotId: slot.id,
    corner,
    startMX: e.clientX,
    startMY: e.clientY,
    startX: slot.x,
    startY: slot.y,
    startW: slot.width,
    startH: slot.height,
  }
  e.preventDefault()
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

function onMouseMove(e: MouseEvent) {
  if (!drag) return
  const scale = canvasScale.value
  const dx = (e.clientX - drag.startMX) / scale
  const dy = (e.clientY - drag.startMY) / scale
  const MIN = 40

  if (drag.type === 'move') {
    let mdx = dx, mdy = dy
    if (e.shiftKey) {
      if (Math.abs(dx) >= Math.abs(dy)) mdy = 0
      else mdx = 0
    }
    let x = drag.startX + mdx
    let y = drag.startY + mdy
    let snappedX = false
    let snappedY = false

    if (gridSettings.snapToObjects) {
      const slotId = drag.slotId
      const slot = slots.value.find((s) => s.id === slotId)
      const targets = collectSnapLines(otherSlotRects(slotId), { width: config.value.outputWidth, height: config.value.outputHeight })
      const threshold = OBJECT_SNAP_PX / scale
      const result = snapMove({ x, y, w: slot?.width ?? 0, h: slot?.height ?? 0 }, targets, threshold)
      if (result.snappedX) { x += result.dx; snappedX = true }
      if (result.snappedY) { y += result.dy; snappedY = true }
      snapGuideV.value = result.vLine
      snapGuideH.value = result.hLine
    } else {
      snapGuideV.value = null
      snapGuideH.value = null
    }

    if (gridSettings.snapEnabled) {
      if (!snappedX) x = snapToGrid(x, gridSettings.gridSize)
      if (!snappedY) y = snapToGrid(y, gridSettings.gridSize)
    }
    patchSlot(drag.slotId, {
      x: Math.round(x),
      y: Math.round(y),
    })
  } else {
    const { corner, startX, startY, startW, startH } = drag
    const fromCenter = e.altKey
    const lockAspect = e.shiftKey
    const ratio = startW / startH
    let x = startX, y = startY, w = startW, h = startH

    if (fromCenter) {
      const cx = startX + startW / 2
      const cy = startY + startH / 2
      if (corner === 'br') { w = Math.max(MIN, startW + 2 * dx); h = Math.max(MIN, startH + 2 * dy) }
      else if (corner === 'bl') { w = Math.max(MIN, startW - 2 * dx); h = Math.max(MIN, startH + 2 * dy) }
      else if (corner === 'tr') { w = Math.max(MIN, startW + 2 * dx); h = Math.max(MIN, startH - 2 * dy) }
      else { w = Math.max(MIN, startW - 2 * dx); h = Math.max(MIN, startH - 2 * dy) }
      if (lockAspect) {
        const s = Math.max(w / startW, h / startH)
        w = Math.max(MIN, startW * s)
        h = Math.max(MIN, startH * s)
      }
      x = cx - w / 2
      y = cy - h / 2
    } else {
      if (corner === 'br') {
        w = Math.max(MIN, startW + dx)
        h = Math.max(MIN, startH + dy)
      } else if (corner === 'bl') {
        const nw = Math.max(MIN, startW - dx)
        x = startX + (startW - nw); w = nw
        h = Math.max(MIN, startH + dy)
      } else if (corner === 'tr') {
        w = Math.max(MIN, startW + dx)
        const nh = Math.max(MIN, startH - dy)
        y = startY + (startH - nh); h = nh
      } else {
        const nw = Math.max(MIN, startW - dx)
        x = startX + (startW - nw); w = nw
        const nh = Math.max(MIN, startH - dy)
        y = startY + (startH - nh); h = nh
      }
      if (lockAspect) {
        if (Math.abs(dx / startW) >= Math.abs(dy / startH)) {
          h = Math.max(MIN, w / ratio)
          if (corner === 'tr' || corner === 'tl') y = startY + startH - h
        } else {
          w = Math.max(MIN, h * ratio)
          if (corner === 'bl' || corner === 'tl') x = startX + startW - w
        }
      }
    }

    snapGuideV.value = null
    snapGuideH.value = null

    let snappedXEdge = false
    let snappedYEdge = false

    if (gridSettings.snapToObjects && !lockAspect && !fromCenter) {
      const targets = collectSnapLines(otherSlotRects(drag.slotId), { width: config.value.outputWidth, height: config.value.outputHeight })
      const threshold = OBJECT_SNAP_PX / scale
      if (corner === 'br' || corner === 'tr') {
        const res = snapEdge(x + w, targets.vertical, threshold)
        if (res.line !== null) { w = res.value - x; snappedXEdge = true; snapGuideV.value = res.line }
      }
      if (corner === 'bl' || corner === 'tl') {
        const res = snapEdge(x, targets.vertical, threshold)
        if (res.line !== null) { const right = startX + startW; x = res.value; w = right - x; snappedXEdge = true; snapGuideV.value = res.line }
      }
      if (corner === 'br' || corner === 'bl') {
        const res = snapEdge(y + h, targets.horizontal, threshold)
        if (res.line !== null) { h = res.value - y; snappedYEdge = true; snapGuideH.value = res.line }
      }
      if (corner === 'tr' || corner === 'tl') {
        const res = snapEdge(y, targets.horizontal, threshold)
        if (res.line !== null) { const bottom = startY + startH; y = res.value; h = bottom - y; snappedYEdge = true; snapGuideH.value = res.line }
      }
    }

    if (gridSettings.snapEnabled && !lockAspect) {
      const g = gridSettings.gridSize
      if (fromCenter) {
        const cx = startX + startW / 2
        const cy = startY + startH / 2
        w = Math.max(MIN, snapToGrid(w, g))
        h = Math.max(MIN, snapToGrid(h, g))
        x = cx - w / 2
        y = cy - h / 2
      } else if (corner === 'br') {
        if (!snappedXEdge) w = Math.max(MIN, snapToGrid(x + w, g) - x)
        if (!snappedYEdge) h = Math.max(MIN, snapToGrid(y + h, g) - y)
      } else if (corner === 'bl') {
        const right = startX + startW
        if (!snappedXEdge) { x = snapToGrid(x, g); w = Math.max(MIN, right - x) }
        if (!snappedYEdge) h = Math.max(MIN, snapToGrid(y + h, g) - y)
      } else if (corner === 'tr') {
        const bottom = startY + startH
        if (!snappedXEdge) w = Math.max(MIN, snapToGrid(x + w, g) - x)
        if (!snappedYEdge) { y = snapToGrid(y, g); h = Math.max(MIN, bottom - y) }
      } else {
        const right = startX + startW
        const bottom = startY + startH
        if (!snappedXEdge) { x = snapToGrid(x, g); w = Math.max(MIN, right - x) }
        if (!snappedYEdge) { y = snapToGrid(y, g); h = Math.max(MIN, bottom - y) }
      }
    }

    patchSlot(drag.slotId, {
      x: Math.round(x), y: Math.round(y),
      width: Math.round(w), height: Math.round(h),
    })
  }
}

function onMouseUp() {
  drag = null
  snapGuideV.value = null
  snapGuideH.value = null
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
}

// --- Alignment ---
function alignSlot(action: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom') {
  const id = selectedSlotId.value
  const slot = selectedSlot.value
  if (!id || !slot) return
  const oW = config.value.outputWidth
  const oH = config.value.outputHeight
  const map = {
    'left':     { x: 0 },
    'center-h': { x: Math.round((oW - slot.width) / 2) },
    'right':    { x: oW - slot.width },
    'top':      { y: 0 },
    'center-v': { y: Math.round((oH - slot.height) / 2) },
    'bottom':   { y: oH - slot.height },
  }
  patchSlot(id, map[action])
}

// --- Space + pan ---
const spacePressed = ref(false)
const isPanning = ref(false)
let pan: { startX: number; startY: number; scrollLeft: number; scrollTop: number } | null = null

function onPanMouseDown(e: MouseEvent) {
  if (e.button !== 0) return
  e.preventDefault()
  const container = canvasContainer.value
  if (!container) return
  isPanning.value = true
  pan = { startX: e.clientX, startY: e.clientY, scrollLeft: container.scrollLeft, scrollTop: container.scrollTop }
  window.addEventListener('mousemove', onPanMove)
  window.addEventListener('mouseup', onPanUp)
}

function onPanMove(e: MouseEvent) {
  if (!pan) return
  const container = canvasContainer.value
  if (!container) return
  container.scrollLeft = pan.scrollLeft - (e.clientX - pan.startX)
  container.scrollTop = pan.scrollTop - (e.clientY - pan.startY)
}

function onPanUp() {
  pan = null
  isPanning.value = false
  window.removeEventListener('mousemove', onPanMove)
  window.removeEventListener('mouseup', onPanUp)
}

// --- Zoom (Cmd/Ctrl+scroll, toward cursor) ---
function onWheel(e: WheelEvent) {
  if (!e.metaKey && !e.ctrlKey) return
  e.preventDefault()
  const container = canvasContainer.value
  if (!container) return

  const oldScale = canvasScale.value
  const newScale = Math.max(0.1, Math.min(4, oldScale * Math.exp(-e.deltaY / 300)))
  if (newScale === oldScale) return

  const board = artboard.value
  if (!board) { userZoom.value = newScale; return }

  const boardRect = board.getBoundingClientRect()
  const fracX = (e.clientX - boardRect.left) / boardRect.width
  const fracY = (e.clientY - boardRect.top) / boardRect.height

  userZoom.value = newScale

  nextTick(() => {
    const nW = Math.round(config.value.outputWidth * newScale)
    const nH = Math.round(config.value.outputHeight * newScale)
    const cW = container.clientWidth
    const cH = container.clientHeight
    const boardX = (Math.max(cW, nW + 64) - nW) / 2
    const boardY = (Math.max(cH, nH + 64) - nH) / 2
    const cr = container.getBoundingClientRect()
    container.scrollLeft = boardX + fracX * nW - (e.clientX - cr.left)
    container.scrollTop = boardY + fracY * nH - (e.clientY - cr.top)
  })
}

// --- Z-order helpers ---
function moveToFront(slotId: string) {
  const slot = slots.value.find((s) => s.id === slotId)
  if (!slot) return
  patchConfig({ slots: [...slots.value.filter((s) => s.id !== slotId), slot] })
}

function moveToBack(slotId: string) {
  const slot = slots.value.find((s) => s.id === slotId)
  if (!slot) return
  patchConfig({ slots: [slot, ...slots.value.filter((s) => s.id !== slotId)] })
}

function moveForward(slotId: string) {
  const idx = slots.value.findIndex((s) => s.id === slotId)
  if (idx >= slots.value.length - 1) return
  const arr = [...slots.value]
  ;[arr[idx], arr[idx + 1]] = [arr[idx + 1]!, arr[idx]!]
  patchConfig({ slots: arr })
}

function moveBackward(slotId: string) {
  const idx = slots.value.findIndex((s) => s.id === slotId)
  if (idx <= 0) return
  const arr = [...slots.value]
  ;[arr[idx - 1], arr[idx]] = [arr[idx]!, arr[idx - 1]!]
  patchConfig({ slots: arr })
}

function duplicateSlot(slotId: string) {
  const slot = slots.value.find((s) => s.id === slotId)
  if (!slot) return
  const dup: FreeformSlotConfig = { ...slot, id: crypto.randomUUID(), x: slot.x + 40, y: slot.y + 40 }
  patchConfig({ slots: [...slots.value, dup] })
  selectedSlotId.value = dup.id
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
    if (drag) {
      drag = null
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
    selectedSlotId.value = null
    return
  }

  if (e.key === 'Tab') {
    e.preventDefault()
    const ids = slots.value.map((s) => s.id)
    if (!ids.length) return
    const idx = selectedSlotId.value ? ids.indexOf(selectedSlotId.value) : -1
    selectedSlotId.value = e.shiftKey
      ? ids[(idx - 1 + ids.length) % ids.length]!
      : ids[(idx + 1) % ids.length]!
    return
  }

  if ((e.key === 'Delete' || e.key === 'Backspace') && selectedSlotId.value) {
    e.preventDefault()
    removeSlot(selectedSlotId.value)
    return
  }

  if (meta && e.key === 'd' && selectedSlotId.value) {
    e.preventDefault()
    duplicateSlot(selectedSlotId.value)
    return
  }

  if (meta && e.key === '0') {
    e.preventDefault()
    userZoom.value = null
    return
  }

  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key) && selectedSlotId.value) {
    e.preventDefault()
    const slot = selectedSlot.value
    if (!slot) return
    const oW = config.value.outputWidth
    const oH = config.value.outputHeight
    if (meta && e.shiftKey) {
      // Align to canvas edges
      if (e.key === 'ArrowLeft') alignSlot('left')
      if (e.key === 'ArrowRight') alignSlot('right')
      if (e.key === 'ArrowUp') alignSlot('top')
      if (e.key === 'ArrowDown') alignSlot('bottom')
    } else {
      // Nudge
      const step = e.shiftKey ? 10 : 1
      const patch: Partial<FreeformSlotConfig> = {}
      if (e.key === 'ArrowLeft') patch.x = slot.x - step
      if (e.key === 'ArrowRight') patch.x = slot.x + step
      if (e.key === 'ArrowUp') patch.y = slot.y - step
      if (e.key === 'ArrowDown') patch.y = slot.y + step
      patchSlot(selectedSlotId.value, patch)
    }
    return
  }

  // Center on canvas
  if (meta && e.shiftKey && selectedSlotId.value) {
    const k = e.key.toLowerCase()
    if (k === 'h') { e.preventDefault(); alignSlot('center-h'); return }
    if (k === 'v') { e.preventDefault(); alignSlot('center-v'); return }
    if (k === 'c') {
      e.preventDefault()
      alignSlot('center-h')
      alignSlot('center-v')
      return
    }
  }

  if (meta && (e.key === ']' || e.key === '[') && selectedSlotId.value) {
    e.preventDefault()
    if (e.shiftKey) {
      e.key === ']' ? moveToFront(selectedSlotId.value) : moveToBack(selectedSlotId.value)
    } else {
      e.key === ']' ? moveForward(selectedSlotId.value) : moveBackward(selectedSlotId.value)
    }
    return
  }
}

function onKeyUp(e: KeyboardEvent) {
  if (e.key === ' ') spacePressed.value = false
}

let _containerEl: HTMLElement | null = null

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  _containerEl = canvasContainer.value ?? null
  _containerEl?.addEventListener('wheel', onWheel, { passive: false })
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
  window.removeEventListener('mousemove', onPanMove)
  window.removeEventListener('mouseup', onPanUp)
  _containerEl?.removeEventListener('wheel', onWheel)
})

// --- Canvas rendering ---
function buildSourceMap() {
  const map = new Map<string, HTMLImageElement>()
  for (const [id, { img }] of sourcesStore.loadedImages) map.set(id, img)
  return map
}

function renderCanvas() {
  const c = canvas.value
  if (!c || sourcesStore.loadedImages.size === 0) return
  render(c, { composition: props.composition, snips: snipsStore.snips, sourceImages: buildSourceMap(), backgroundImage: loadedBgImage.value, watermark: watermark.value })
}

watch(
  [() => props.composition, () => snipsStore.snips, () => sourcesStore.loadedImages, watermark, loadedBgImage],
  () => nextTick(renderCanvas),
  { deep: true, immediate: true },
)

// The immediate watcher above fires during setup, before the canvas ref is
// bound, so it can't draw anything yet. Render again once mounted in case
// nothing else changes afterward to re-trigger the watcher.
onMounted(() => nextTick(renderCanvas))
</script>

<style scoped>
.handle {
  position: absolute;
  width: 10px;
  height: 10px;
  background: var(--color-accent);
  border: 2px solid white;
  border-radius: 2px;
}
.handle.tl { top: -5px; left: -5px; cursor: nw-resize; }
.handle.tr { top: -5px; right: -5px; cursor: ne-resize; }
.handle.bl { bottom: -5px; left: -5px; cursor: sw-resize; }
.handle.br { bottom: -5px; right: -5px; cursor: se-resize; }

.mismatch-tip {
  position: relative;
  display: flex;
  align-items: center;
  cursor: default;
}
.mismatch-tip-label {
  display: none;
  position: absolute;
  bottom: calc(100% + 5px);
  right: 0;
  white-space: nowrap;
  font-size: 11px;
  color: #fbbf24;
  background: #111316;
  border: 1px solid rgba(251,191,36,0.3);
  border-radius: 5px;
  padding: 3px 7px;
  pointer-events: none;
  z-index: 50;
}
.mismatch-tip:hover .mismatch-tip-label {
  display: block;
}

.mismatch-fade-enter-active,
.mismatch-fade-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.mismatch-fade-enter-from,
.mismatch-fade-leave-to { opacity: 0; transform: translateY(4px); }
</style>
