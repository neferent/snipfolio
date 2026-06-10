<template>
  <div class="flex h-10 shrink-0 items-center gap-px border-b border-[var(--color-border)] bg-[var(--color-surface-2)] px-2">

    <!-- Horizontal alignment (left/center/right → vertical guideline icons) -->
    <button v-bind="btn(!sel)" title="Align left  Cmd+Shift+←" aria-label="Align left" @click="$emit('align-left')">
      <AlignStartVertical class="size-3.5" aria-hidden="true" />
    </button>
    <button v-bind="btn(!sel)" title="Center horizontally  Cmd+Shift+H" aria-label="Center horizontally" @click="$emit('align-center-h')">
      <AlignCenterVertical class="size-3.5" aria-hidden="true" />
    </button>
    <button v-bind="btn(!sel)" title="Align right  Cmd+Shift+→" aria-label="Align right" @click="$emit('align-right')">
      <AlignEndVertical class="size-3.5" aria-hidden="true" />
    </button>

    <div class="mx-1 h-5 w-px shrink-0 bg-[var(--color-border)]" aria-hidden="true" />

    <!-- Vertical alignment (top/center/bottom → horizontal guideline icons) -->
    <button v-bind="btn(!sel)" title="Align top  Cmd+Shift+↑" aria-label="Align top" @click="$emit('align-top')">
      <AlignStartHorizontal class="size-3.5" aria-hidden="true" />
    </button>
    <button v-bind="btn(!sel)" title="Center vertically  Cmd+Shift+V" aria-label="Center vertically" @click="$emit('align-center-v')">
      <AlignCenterHorizontal class="size-3.5" aria-hidden="true" />
    </button>
    <button v-bind="btn(!sel)" title="Align bottom  Cmd+Shift+↓" aria-label="Align bottom" @click="$emit('align-bottom')">
      <AlignEndHorizontal class="size-3.5" aria-hidden="true" />
    </button>

    <div class="mx-1 h-5 w-px shrink-0 bg-[var(--color-border)]" aria-hidden="true" />

    <!-- Z-order -->
    <button v-bind="btn(!sel)" title="Bring forward  Cmd+]" aria-label="Bring forward" @click="$emit('z-forward')">
      <MoveUp class="size-3.5" aria-hidden="true" />
    </button>
    <button v-bind="btn(!sel)" title="Send backward  Cmd+[" aria-label="Send backward" @click="$emit('z-back')">
      <MoveDown class="size-3.5" aria-hidden="true" />
    </button>
    <button v-bind="btn(!sel)" title="Bring to front  Cmd+Shift+]" aria-label="Bring to front" @click="$emit('z-front')">
      <BringToFront class="size-3.5" aria-hidden="true" />
    </button>
    <button v-bind="btn(!sel)" title="Send to back  Cmd+Shift+[" aria-label="Send to back" @click="$emit('z-bottom')">
      <SendToBack class="size-3.5" aria-hidden="true" />
    </button>

    <div class="mx-1 h-5 w-px shrink-0 bg-[var(--color-border)]" aria-hidden="true" />

    <!-- Delete -->
    <button v-bind="btn(!sel, true)" title="Delete slot  Delete" aria-label="Delete slot" @click="$emit('delete-slot')">
      <Trash2 class="size-3.5" aria-hidden="true" />
    </button>

    <div class="flex-1" />

    <!-- Zoom -->
    <button v-bind="btn()" title="Zoom out" aria-label="Zoom out" @click="$emit('zoom-change', Math.max(0.1, zoom - 0.1))">
      <ZoomOut class="size-3.5" aria-hidden="true" />
    </button>
    <input
      class="!h-7 w-16 rounded bg-[var(--color-surface-3)] px-1.5 py-0.5 text-center font-mono text-xs text-[var(--color-text)] outline-none ring-inset focus:ring-1 focus:ring-[var(--color-accent)]"
      aria-label="Zoom level"
      :value="zoomLabel"
      @focus="($event.target as HTMLInputElement).select()"
      @keydown.enter.prevent="onZoomCommit($event)"
      @keydown.escape="($event.target as HTMLInputElement).blur()"
      @blur="($event.target as HTMLInputElement).value = zoomLabel"
    />
    <button v-bind="btn()" title="Zoom in" aria-label="Zoom in" @click="$emit('zoom-change', Math.min(4, zoom + 0.1))">
      <ZoomIn class="size-3.5" aria-hidden="true" />
    </button>
    <button v-bind="btn()" title="Fit to window  Cmd+0" aria-label="Fit to window" @click="$emit('zoom-fit')">
      <Maximize2 class="size-3.5" aria-hidden="true" />
    </button>
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

const BASE = 'size-7 flex items-center justify-center rounded text-[var(--color-text-muted)] transition-colors hover:bg-white/10 hover:text-[var(--color-text)]'

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
