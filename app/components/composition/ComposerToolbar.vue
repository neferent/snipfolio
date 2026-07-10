<template>
  <div class="flex h-10 shrink-0 items-center gap-px border-b border-[var(--color-border)] bg-[var(--color-surface-2)] px-2">

    <!-- Horizontal alignment (left/center/right → vertical guideline icons) -->
    <AppTooltip text="Align left  Cmd+Shift+←">
      <button v-bind="btn(!sel)" aria-label="Align left" @click="$emit('align-left')">
        <AlignStartVertical class="size-3.5" aria-hidden="true" />
      </button>
    </AppTooltip>
    <AppTooltip text="Center horizontally  Cmd+Shift+H">
      <button v-bind="btn(!sel)" aria-label="Center horizontally" @click="$emit('align-center-h')">
        <AlignCenterVertical class="size-3.5" aria-hidden="true" />
      </button>
    </AppTooltip>
    <AppTooltip text="Align right  Cmd+Shift+→">
      <button v-bind="btn(!sel)" aria-label="Align right" @click="$emit('align-right')">
        <AlignEndVertical class="size-3.5" aria-hidden="true" />
      </button>
    </AppTooltip>

    <div class="mx-1 h-5 w-px shrink-0 bg-[var(--color-border)]" aria-hidden="true" />

    <!-- Vertical alignment (top/center/bottom → horizontal guideline icons) -->
    <AppTooltip text="Align top  Cmd+Shift+↑">
      <button v-bind="btn(!sel)" aria-label="Align top" @click="$emit('align-top')">
        <AlignStartHorizontal class="size-3.5" aria-hidden="true" />
      </button>
    </AppTooltip>
    <AppTooltip text="Center vertically  Cmd+Shift+V">
      <button v-bind="btn(!sel)" aria-label="Center vertically" @click="$emit('align-center-v')">
        <AlignCenterHorizontal class="size-3.5" aria-hidden="true" />
      </button>
    </AppTooltip>
    <AppTooltip text="Align bottom  Cmd+Shift+↓">
      <button v-bind="btn(!sel)" aria-label="Align bottom" @click="$emit('align-bottom')">
        <AlignEndHorizontal class="size-3.5" aria-hidden="true" />
      </button>
    </AppTooltip>

    <div class="mx-1 h-5 w-px shrink-0 bg-[var(--color-border)]" aria-hidden="true" />

    <!-- Z-order -->
    <AppTooltip text="Bring forward  Cmd+]">
      <button v-bind="btn(!sel)" aria-label="Bring forward" @click="$emit('z-forward')">
        <MoveUp class="size-3.5" aria-hidden="true" />
      </button>
    </AppTooltip>
    <AppTooltip text="Send backward  Cmd+[">
      <button v-bind="btn(!sel)" aria-label="Send backward" @click="$emit('z-back')">
        <MoveDown class="size-3.5" aria-hidden="true" />
      </button>
    </AppTooltip>
    <AppTooltip text="Bring to front  Cmd+Shift+]">
      <button v-bind="btn(!sel)" aria-label="Bring to front" @click="$emit('z-front')">
        <BringToFront class="size-3.5" aria-hidden="true" />
      </button>
    </AppTooltip>
    <AppTooltip text="Send to back  Cmd+Shift+[">
      <button v-bind="btn(!sel)" aria-label="Send to back" @click="$emit('z-bottom')">
        <SendToBack class="size-3.5" aria-hidden="true" />
      </button>
    </AppTooltip>

    <div class="mx-1 h-5 w-px shrink-0 bg-[var(--color-border)]" aria-hidden="true" />

    <!-- Delete -->
    <AppTooltip text="Delete slot  Delete">
      <button v-bind="btn(!sel, true)" aria-label="Delete slot" @click="$emit('delete-slot')">
        <Trash2 class="size-3.5" aria-hidden="true" />
      </button>
    </AppTooltip>

    <div class="flex-1" />

    <!-- Grid controls -->
    <GridControls />
    <div class="mx-1 h-5 w-px shrink-0 bg-[var(--color-border)]" aria-hidden="true" />

    <!-- Zoom -->
    <AppTooltip text="Zoom out">
      <button v-bind="btn()" aria-label="Zoom out" @click="$emit('zoom-change', Math.max(0.1, zoom - 0.1))">
        <ZoomOut class="size-3.5" aria-hidden="true" />
      </button>
    </AppTooltip>
    <AppInput
      size="sm"
      class="w-16 text-center font-mono"
      aria-label="Zoom level"
      :model-value="zoomLabel"
      @focus="($event.target as HTMLInputElement).select()"
      @keydown.enter.prevent="onZoomCommit($event)"
      @keydown.escape="($event.target as HTMLInputElement).blur()"
      @blur="($event.target as HTMLInputElement).value = zoomLabel"
    />
    <AppTooltip text="Zoom in">
      <button v-bind="btn()" aria-label="Zoom in" @click="$emit('zoom-change', Math.min(4, zoom + 0.1))">
        <ZoomIn class="size-3.5" aria-hidden="true" />
      </button>
    </AppTooltip>
    <AppTooltip text="Fit to window  Cmd+0">
      <button v-bind="btn()" aria-label="Fit to window" @click="$emit('zoom-fit')">
        <Maximize2 class="size-3.5" aria-hidden="true" />
      </button>
    </AppTooltip>
  </div>
</template>

<script setup lang="ts">
import {
  AlignStartHorizontal, AlignCenterHorizontal, AlignEndHorizontal,
  AlignStartVertical, AlignCenterVertical, AlignEndVertical,
  MoveUp, MoveDown, BringToFront, SendToBack,
  Trash2, ZoomIn, ZoomOut, Maximize2,
} from 'lucide-vue-next'
import type { FreeformSlotConfig } from '~/types'

const props = defineProps<{
  selectedSlot: FreeformSlotConfig | null
  zoom: number
}>()

const emit = defineEmits<{
  'align-left': []
  'align-center-h': []
  'align-right': []
  'align-top': []
  'align-center-v': []
  'align-bottom': []
  'z-forward': []
  'z-back': []
  'z-front': []
  'z-bottom': []
  'delete-slot': []
  'zoom-change': [value: number]
  'zoom-fit': []
}>()

const sel = computed(() => !!props.selectedSlot)
const zoomLabel = computed(() => Math.round(props.zoom * 100) + '%')

const BASE = 'size-7 flex items-center justify-center rounded text-[var(--color-text-muted)] transition-colors hover:bg-overlay/10 hover:text-[var(--color-text)]'

function btn(disabled = false, danger = false) {
  return {
    class: [
      BASE,
      disabled ? 'pointer-events-none opacity-30' : '',
      danger && !disabled ? 'hover:!text-red-400' : '',
    ],
  }
}

function onZoomCommit(e: KeyboardEvent) {
  const raw = (e.target as HTMLInputElement).value.replace('%', '').trim()
  const pct = parseFloat(raw)
  if (!isNaN(pct) && pct > 0) emit('zoom-change', pct / 100)
  ;(e.target as HTMLInputElement).blur()
}
</script>
