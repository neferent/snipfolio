<template>
  <TransitionRoot appear :show="open" as="template">
    <Dialog as="div" class="relative z-50" @close="$emit('close')">

      <TransitionChild
        enter="ease-out duration-200"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="ease-in duration-150"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black/80" />
      </TransitionChild>

      <TransitionChild
        as="template"
        enter="ease-out duration-200"
        enter-from="opacity-0 scale-95"
        enter-to="opacity-100 scale-100"
        leave="ease-in duration-150"
        leave-from="opacity-100 scale-100"
        leave-to="opacity-0 scale-95"
      >
        <DialogPanel class="fixed inset-0 flex flex-col">
          <!-- Top bar -->
          <div class="flex shrink-0 items-center justify-between px-4 py-3">
            <DialogTitle class="text-sm font-medium text-white/80">{{ title ?? 'Preview' }}</DialogTitle>
            <button
              class="rounded-[6px] p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white"
              aria-label="Close"
              @click="$emit('close')"
            >
              <X class="size-4" />
            </button>
          </div>

          <!-- Pan/zoom viewport. wrapper is the non-scrolling box we measure for "fit" — scrollArea
               (the actual scroll container) isn't measured directly because its own clientWidth/Height
               shrink whenever a scrollbar appears (i.e. whenever zoom pushes the image past the
               container), which would feed back into fitToScreen and cap the reachable zoom below 100%. -->
          <div ref="wrapper" class="relative min-h-0 flex-1 overflow-hidden">
            <!-- No flex/grid centering here on purpose: justify-content/align-items "center" on an
                 overflow:auto container clips the start of overflowing content in Chromium/WebKit
                 (scrollLeft's minimum ends up past the image's true left edge). Plain block layout
                 with margin:auto on the image centers it when it fits and is fully scrollable —
                 all edges reachable — once it overflows. -->
            <div
              ref="scrollArea"
              class="h-full w-full overflow-auto p-6"
              @wheel="onWheel"
            >
              <img
                v-if="src"
                ref="imgEl"
                :src="src"
                :alt="alt ?? 'Preview'"
                class="block max-w-none max-h-none select-none"
                :class="canZoom ? 'cursor-grab active:cursor-grabbing' : ''"
                :style="{ width: `${dispW}px`, height: `${dispH}px`, margin: 'auto' }"
                draggable="false"
                @load="onImageLoad"
                @mousedown="startPan"
              >
            </div>

            <!-- Zoom toolbar -->
            <div class="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
              <div class="pointer-events-auto flex items-center gap-1 rounded-lg bg-black/70 p-1 ring-1 ring-white/10 backdrop-blur">
                <button
                  class="flex size-6 items-center justify-center rounded text-white/70 transition hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-30"
                  :disabled="!canZoom || zoomPct <= Math.round(minZoom * 100)"
                  aria-label="Zoom out"
                  @click="zoomOut"
                >
                  −
                </button>
                <button
                  class="min-w-12 rounded px-1 py-0.5 text-center text-xs text-white/70 transition hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-30"
                  :disabled="!canZoom"
                  title="Zoom to fit"
                  aria-label="Zoom to fit"
                  @click="zoomToFit"
                >
                  {{ zoomPct }}%
                </button>
                <button
                  class="flex size-6 items-center justify-center rounded text-white/70 transition hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-30"
                  :disabled="!canZoom || zoomPct >= Math.round(maxZoom * 100)"
                  aria-label="Zoom in"
                  @click="zoomIn"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </DialogPanel>
      </TransitionChild>

    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch, onBeforeUnmount } from 'vue'
import { TransitionRoot, TransitionChild, Dialog, DialogPanel, DialogTitle } from '@headlessui/vue'
import { X } from 'lucide-vue-next'

const props = defineProps<{
  open: boolean
  src: string
  alt?: string
  title?: string
}>()
defineEmits<{ close: [] }>()

const wrapper = ref<HTMLElement | null>(null)
const scrollArea = ref<HTMLElement | null>(null)
const imgEl = ref<HTMLImageElement | null>(null)

// On a HiDPI/Retina display, 1 image pixel = 1 CSS pixel is NOT 1 image pixel = 1 physical
// screen pixel — the browser still has to stretch the raster across devicePixelRatio physical
// pixels, softening it. That made "100%" in this lightbox look blurrier than opening the same
// PNG directly (an OS image viewer shows true native pixels). Dividing by DPR here means "100%"
// actually maps 1 image pixel to 1 physical pixel, matching what you'd see outside the browser.
const DPR = typeof window !== 'undefined' && window.devicePixelRatio ? window.devicePixelRatio : 1

const naturalW = ref(0)
const naturalH = ref(0)
const scale = ref(1)
const minZoom = ref(1)
const maxZoom = computed(() => Math.max(minZoom.value, 1))
const zoomPct = computed(() => Math.round(scale.value * 100))
const canZoom = computed(() => maxZoom.value > minZoom.value + 0.001)

const dispW = computed(() => Math.round((naturalW.value / DPR) * scale.value))
const dispH = computed(() => Math.round((naturalH.value / DPR) * scale.value))

const PADDING = 48

function fitToScreen() {
  if (!wrapper.value || !naturalW.value || !naturalH.value) return
  const availW = Math.max(1, wrapper.value.clientWidth - PADDING)
  const availH = Math.max(1, wrapper.value.clientHeight - PADDING)
  minZoom.value = Math.min(availW / (naturalW.value / DPR), availH / (naturalH.value / DPR))
  scale.value = minZoom.value
}

function onImageLoad() {
  const img = imgEl.value
  if (!img) return
  naturalW.value = img.naturalWidth
  naturalH.value = img.naturalHeight
  fitToScreen()
}

function zoomAt(target: number, clientX?: number, clientY?: number) {
  const area = scrollArea.value
  if (!area) return
  const clamped = Math.min(maxZoom.value, Math.max(minZoom.value, target))
  if (Math.abs(clamped - scale.value) < 0.0001) return
  const rect = area.getBoundingClientRect()
  const anchorX = clientX !== undefined ? clientX - rect.left : rect.width / 2
  const anchorY = clientY !== undefined ? clientY - rect.top : rect.height / 2
  const contentX = area.scrollLeft + anchorX
  const contentY = area.scrollTop + anchorY
  const ratio = clamped / scale.value
  scale.value = clamped
  nextTick(() => {
    area.scrollLeft = contentX * ratio - anchorX
    area.scrollTop = contentY * ratio - anchorY
  })
}

const ZOOM_STEP = 0.1
function zoomIn() { zoomAt(scale.value + ZOOM_STEP) }
function zoomOut() { zoomAt(scale.value - ZOOM_STEP) }
function zoomToFit() { zoomAt(minZoom.value) }

function onWheel(e: WheelEvent) {
  if (!(e.ctrlKey || e.metaKey)) return
  e.preventDefault()
  zoomAt(scale.value * Math.exp(-e.deltaY * 0.01), e.clientX, e.clientY)
}

function startPan(e: MouseEvent) {
  const area = scrollArea.value
  if (!area || e.button !== 0) return
  const startX = e.clientX
  const startY = e.clientY
  const startScrollLeft = area.scrollLeft
  const startScrollTop = area.scrollTop

  const onMove = (e: MouseEvent) => {
    area.scrollLeft = startScrollLeft - (e.clientX - startX)
    area.scrollTop = startScrollTop - (e.clientY - startY)
  }
  const onUp = () => {
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}

watch(() => props.open, (v) => {
  if (v) {
    window.addEventListener('resize', fitToScreen)
    nextTick(fitToScreen)
  } else {
    window.removeEventListener('resize', fitToScreen)
  }
})
onBeforeUnmount(() => window.removeEventListener('resize', fitToScreen))
</script>
