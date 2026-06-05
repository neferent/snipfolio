<template>
  <div class="absolute inset-0 flex">
    <!-- Left sidebar: slot list (z-order) + add snips -->
    <aside class="flex w-56 shrink-0 flex-col overflow-hidden border-r border-[var(--color-border)] bg-[var(--color-surface-2)]">
      <div class="border-b border-[var(--color-border)] px-4 py-3">
        <h2 class="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Layers</h2>
      </div>

      <div class="flex-1 overflow-y-auto">
        <!-- Slot list (top = front) -->
        <div v-if="slots.length > 0" class="p-2">
          <p class="px-2 pb-1 text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
            Slots · top = front
          </p>
          <div
            v-for="(slot, idx) in displaySlots"
            :key="slot.id"
            class="group flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition"
            :class="
              selectedSlotId === slot.id
                ? 'bg-[var(--color-accent)]/15 text-[var(--color-accent)]'
                : 'cursor-pointer text-[var(--color-text)] hover:bg-white/5'
            "
            @click="selectedSlotId = slot.id"
          >
            <!-- z-order controls -->
            <div class="flex shrink-0 flex-col gap-px">
              <button
                class="flex h-3 w-3 items-center justify-center rounded text-[var(--color-text-muted)] transition hover:text-[var(--color-text)] disabled:opacity-30"
                :disabled="idx === 0"
                @click.stop="moveSlotUp(slot.id)"
                title="Move forward"
              >
                <svg class="size-2.5" viewBox="0 0 10 10" fill="currentColor"><path d="M5 2L9 7H1L5 2Z"/></svg>
              </button>
              <button
                class="flex h-3 w-3 items-center justify-center rounded text-[var(--color-text-muted)] transition hover:text-[var(--color-text)] disabled:opacity-30"
                :disabled="idx === displaySlots.length - 1"
                @click.stop="moveSlotDown(slot.id)"
                title="Move backward"
              >
                <svg class="size-2.5" viewBox="0 0 10 10" fill="currentColor"><path d="M5 8L1 3H9L5 8Z"/></svg>
              </button>
            </div>

            <SnipThumbnail :snip="snipFor(slot.snipId)" class="size-7 shrink-0 rounded" />

            <span class="flex-1 truncate">{{ snipLabel(slot.snipId) }}</span>

            <button
              class="ml-auto shrink-0 rounded p-0.5 text-[var(--color-text-muted)] opacity-0 transition hover:text-red-400 group-hover:opacity-100"
              @click.stop="removeSlot(slot.id)"
              title="Remove slot"
            >
              <svg class="size-3" viewBox="0 0 10 10" fill="currentColor">
                <path d="M1.5 1.5L8.5 8.5M8.5 1.5L1.5 8.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="border-t border-[var(--color-border)] p-2">
          <p class="px-2 pb-1 text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
            Add snip
          </p>
          <div
            v-for="snip in availableSnips"
            :key="snip.id"
            class="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs text-[var(--color-text)] transition hover:bg-white/5"
            @click="addSnip(snip)"
          >
            <SnipThumbnail :snip="snip" class="size-7 shrink-0 rounded" />
            <span class="flex-1 truncate">{{ snip.label }}</span>
            <svg class="size-3 shrink-0 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 10 10" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" d="M5 1v8M1 5h8"/>
            </svg>
          </div>
          <p v-if="availableSnips.length === 0" class="px-2 py-2 text-[var(--color-text-muted)]">
            No snips — draw some first
          </p>
        </div>
      </div>
    </aside>

    <!-- Center: interactive artboard -->
    <div
      ref="canvasContainer"
      class="relative flex-1 overflow-auto bg-[var(--color-surface)]"
      @mousedown.self="selectedSlotId = null"
    >
      <div class="flex min-h-full items-center justify-center p-8">
        <!-- Artboard -->
        <div
          ref="artboard"
          class="relative shadow-2xl"
          :style="{ width: previewW + 'px', height: previewH + 'px' }"
          @mousedown.self="selectedSlotId = null"
        >
          <!-- Full-composition canvas (background + all slots rendered) -->
          <canvas
            ref="canvas"
            class="pointer-events-none absolute inset-0"
            :style="{ width: previewW + 'px', height: previewH + 'px' }"
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

    <!-- Right sidebar: slot properties + background + output + export -->
    <aside class="flex w-64 shrink-0 flex-col overflow-y-auto border-l border-[var(--color-border)] bg-[var(--color-surface-2)]">
      <!-- Selected slot controls -->
      <template v-if="selectedSlot">
        <div class="border-b border-[var(--color-border)] px-4 py-3">
          <h2 class="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Slot</h2>
        </div>
        <div class="border-b border-[var(--color-border)] p-4 space-y-3">
          <div class="space-y-2">
            <label class="text-xs font-medium text-[var(--color-text-muted)]">Frame</label>
            <div class="grid grid-cols-2 gap-1.5">
              <button
                v-for="frame in frames"
                :key="frame.value"
                class="rounded-lg border py-1.5 text-xs transition"
                :class="
                  selectedSlot.deviceFrame === frame.value
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/15 text-[var(--color-accent)]'
                    : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-white/20'
                "
                @click="updateSlotFrame(selectedSlot.id, frame.value)"
              >
                {{ frame.label }}
              </button>
            </div>
            <div v-if="selectedSlot.deviceFrame !== 'none'" class="flex items-center gap-2">
              <label class="text-xs text-[var(--color-text-muted)]">Color</label>
              <input
                type="color"
                :value="selectedSlot.frameColor ?? '#262c44'"
                class="h-7 w-10 cursor-pointer rounded border border-[var(--color-border)] bg-transparent p-0.5"
                @input="patchSlot(selectedSlot.id, { frameColor: ($event.target as HTMLInputElement).value })"
              />
              <button
                class="text-xs text-[var(--color-text-muted)] transition hover:text-[var(--color-text)]"
                @click="patchSlot(selectedSlot.id, { frameColor: undefined })"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </template>

      <div class="px-4 py-3 border-b border-[var(--color-border)]">
        <h2 class="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Settings</h2>
      </div>

      <div class="flex-1 overflow-y-auto p-4 space-y-5">
        <BackgroundControls :model-value="config.background" @update:model-value="updateBackground" />

        <!-- Output size -->
        <div class="space-y-2">
          <label class="text-xs font-medium text-[var(--color-text-muted)]">Output size</label>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="preset in sizePresets"
              :key="preset.label"
              class="rounded-lg border py-1.5 text-xs transition"
              :class="
                config.outputWidth === preset.w && config.outputHeight === preset.h
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/15 text-[var(--color-accent)]'
                  : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-white/20'
              "
              @click="setOutputSize(preset.w, preset.h)"
            >
              {{ preset.label }}
            </button>
          </div>
          <div class="flex items-center gap-2">
            <input
              type="number"
              :value="config.outputWidth"
              class="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-3)] px-2 py-1 text-xs text-[var(--color-text)] outline-none"
              placeholder="Width"
              @change="setOutputSize(Number(($event.target as HTMLInputElement).value), config.outputHeight)"
            />
            <span class="shrink-0 text-xs text-[var(--color-text-muted)]">×</span>
            <input
              type="number"
              :value="config.outputHeight"
              class="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-3)] px-2 py-1 text-xs text-[var(--color-text)] outline-none"
              placeholder="Height"
              @change="setOutputSize(config.outputWidth, Number(($event.target as HTMLInputElement).value))"
            />
          </div>
        </div>

        <!-- Composition name -->
        <div class="space-y-1.5">
          <label class="text-xs font-medium text-[var(--color-text-muted)]">Name</label>
          <input
            :value="composition.name"
            class="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-3)] px-3 py-1.5 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
            @input="$emit('update-name', ($event.target as HTMLInputElement).value)"
          />
        </div>

        <!-- Export -->
        <button
          class="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-accent)] py-2 text-sm font-medium text-white transition hover:bg-[var(--color-accent-hover)]"
          @click="$emit('export')"
        >
          <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 17l4 4 4-4m-4-12v16" />
          </svg>
          Export PNG
        </button>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { useElementSize } from '@vueuse/core'
import { useCanvasRenderer } from '~/composables/useCanvasRenderer'
import { useSnipsStore } from '~/stores/snips'
import { useSourcesStore } from '~/stores/sources'
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
const { render } = useCanvasRenderer()

const canvas = ref<HTMLCanvasElement>()
const canvasContainer = ref<HTMLElement>()
const artboard = ref<HTMLElement>()

const config = computed(() => props.composition.config as FreeformCompositionConfig)
// slots stored back-to-front (index 0 = back). Display reversed so top of list = front.
const slots = computed(() => config.value.slots)
const displaySlots = computed(() => [...slots.value].reverse())

const { width: containerW, height: containerH } = useElementSize(canvasContainer)

const canvasScale = computed(() => {
  if (!containerW.value || !containerH.value) return 1
  const pad = 64
  return Math.min(
    (containerW.value - pad) / config.value.outputWidth,
    (containerH.value - pad) / config.value.outputHeight,
    1,
  )
})

const previewW = computed(() => Math.round(config.value.outputWidth * canvasScale.value))
const previewH = computed(() => Math.round(config.value.outputHeight * canvasScale.value))

const selectedSlotId = ref<string | null>(null)
const selectedSlot = computed(() => slots.value.find((s) => s.id === selectedSlotId.value) ?? null)

const snips = computed(() => snipsStore.orderedSnips)
const availableSnips = computed(() => snipsStore.orderedSnips)

const frames: { value: DeviceFrame; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'phone', label: 'Phone' },
  { value: 'browser', label: 'Browser' },
  { value: 'laptop', label: 'Laptop' },
]

const sizePresets = [
  { label: '1920×1080', w: 1920, h: 1080 },
  { label: '1080×1920', w: 1080, h: 1920 },
  { label: '1080×1080', w: 1080, h: 1080 },
  { label: '1280×720', w: 1280, h: 720 },
]

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

// displaySlots is reversed (front first), so index in displaySlots is inverse of slots array index
function moveSlotUp(slotId: string) {
  // "Up" in display = higher z-index = later in array
  const arr = [...slots.value]
  const idx = arr.findIndex((s) => s.id === slotId)
  if (idx < arr.length - 1) {
    ;[arr[idx], arr[idx + 1]] = [arr[idx + 1]!, arr[idx]!]
    patchConfig({ slots: arr })
  }
}

function moveSlotDown(slotId: string) {
  const arr = [...slots.value]
  const idx = arr.findIndex((s) => s.id === slotId)
  if (idx > 0) {
    ;[arr[idx], arr[idx - 1]] = [arr[idx - 1]!, arr[idx]!]
    patchConfig({ slots: arr })
  }
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

function onSlotMouseDown(e: MouseEvent, slot: FreeformSlotConfig) {
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
    patchSlot(drag.slotId, {
      x: Math.round(drag.startX + dx),
      y: Math.round(drag.startY + dy),
    })
  } else {
    const { corner, startX, startY, startW, startH } = drag
    let x = startX, y = startY, w = startW, h = startH
    if (corner === 'br') {
      w = Math.max(MIN, startW + dx)
      h = Math.max(MIN, startH + dy)
    } else if (corner === 'bl') {
      const newW = Math.max(MIN, startW - dx)
      x = startX + (startW - newW)
      w = newW
      h = Math.max(MIN, startH + dy)
    } else if (corner === 'tr') {
      w = Math.max(MIN, startW + dx)
      const newH = Math.max(MIN, startH - dy)
      y = startY + (startH - newH)
      h = newH
    } else {
      // tl
      const newW = Math.max(MIN, startW - dx)
      x = startX + (startW - newW)
      w = newW
      const newH = Math.max(MIN, startH - dy)
      y = startY + (startH - newH)
      h = newH
    }
    patchSlot(drag.slotId, {
      x: Math.round(x), y: Math.round(y),
      width: Math.round(w), height: Math.round(h),
    })
  }
}

function onMouseUp() {
  drag = null
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
}

onUnmounted(() => {
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
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
  render(c, { composition: props.composition, snips: snipsStore.snips, sourceImages: buildSourceMap() })
}

watch(
  [() => props.composition, () => snipsStore.snips, () => sourcesStore.loadedImages],
  () => nextTick(renderCanvas),
  { deep: true, immediate: true },
)
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
</style>
