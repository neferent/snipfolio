<template>
  <AppModal :open="open" title="Capture from URL" @close="onClose">
    <div class="flex flex-col gap-3">
      <div class="flex gap-2">
        <input
          v-model="url"
          type="url"
          placeholder="https://example.com"
          :disabled="isCapturing"
          class="h-8 flex-1 rounded-[6px] border border-white/10 bg-white/5 px-3 text-xs text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 focus:ring-white/20 disabled:opacity-40"
          @keydown.enter="onCapture"
        />
        <button
          class="flex h-8 items-center rounded-[6px] border-strong px-3 text-xs text-[var(--color-text)] transition hover:bg-white/5 disabled:opacity-40"
          :disabled="isCapturing || !url || selectedViewports.length === 0"
          @click="onCapture"
        >
          Capture
        </button>
      </div>

      <!-- Viewport checkboxes -->
      <div class="flex items-center gap-4">
        <label
          v-for="v in viewports"
          :key="v.key"
          class="flex cursor-pointer items-center gap-1.5 text-xs text-[var(--color-text-muted)] select-none"
        >
          <input
            v-model="selectedViewports"
            type="checkbox"
            :value="v.key"
            :disabled="isCapturing"
            class="accent-white"
          />
          {{ v.label }}
        </label>
      </div>

      <!-- Per-viewport pills -->
      <div v-if="captureStates.length" class="flex items-end gap-2">
        <div
          v-for="state in captureStates"
          :key="state.viewport"
          class="flex flex-col overflow-hidden border border-white/10"
          :style="{ width: pillWidth(state.viewport) + 'px' }"
        >
          <div class="relative flex items-center justify-center bg-black/20" style="height: 72px;">
            <template v-if="state.status === 'loading'">
              <Loader2Icon class="size-4 animate-spin text-white/30" />
            </template>
            <template v-else-if="state.status === 'done' && state.src">
              <img
                :src="state.src"
                class="absolute left-0 top-0 block"
                :style="{ width: pillWidth(state.viewport) + 'px' }"
                draggable="false"
              />
            </template>
            <template v-else-if="state.status === 'error'">
              <XIcon class="size-4 text-red-400" />
            </template>
          </div>
          <div class="flex items-center gap-1 border-t border-white/10 px-1.5 py-1">
            <CheckIcon v-if="state.status === 'done'" class="size-3 shrink-0 text-emerald-400" />
            <Loader2Icon v-else-if="state.status === 'loading'" class="size-3 shrink-0 animate-spin text-white/30" />
            <XIcon v-else-if="state.status === 'error'" class="size-3 shrink-0 text-red-400" />
            <span class="truncate text-[10px]" :class="state.status === 'error' ? 'text-red-400' : 'text-[var(--color-text-muted)]'">
              {{ viewportLabel(state.viewport) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <button
        class="flex h-8 items-center rounded-[6px] px-4 text-sm text-[var(--color-text-muted)] transition hover:bg-white/5"
        @click="onClose"
      >
        Cancel
      </button>
      <button
        v-if="successful.length > 0"
        class="flex h-8 items-center rounded-[6px] bg-[var(--color-accent)] px-4 text-sm font-medium transition hover:bg-[var(--color-accent-hover)] hover:text-[var(--color-text)] text-[var(--color-on-accent)]"
        @click="onConfirm"
      >
        Add {{ successful.length }} {{ successful.length === 1 ? 'source' : 'sources' }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { Loader2Icon, CheckIcon, XIcon } from 'lucide-vue-next'

type Viewport = 'desktop' | 'tablet' | 'mobile'
type CaptureStatus = 'loading' | 'done' | 'error'

interface CaptureState {
  viewport: Viewport
  status: CaptureStatus
  error?: string
  src?: string
}

const props = defineProps<{ open: boolean }>()

const emit = defineEmits<{
  close: []
  loaded: [img: HTMLImageElement, src: string, filename: string]
  batchLoaded: [items: Array<{ img: HTMLImageElement; src: string; filename: string }>]
}>()

const url = ref('')
const selectedViewports = ref<Viewport[]>(['desktop', 'tablet', 'mobile'])
const captureStates = ref<CaptureState[]>([])
const captureResults = ref<Array<{ img: HTMLImageElement; src: string; filename: string }>>([])
const isCapturing = computed(() => captureStates.value.some(s => s.status === 'loading'))
const successful = computed(() => captureResults.value)

const viewports: { key: Viewport; label: string; width: number }[] = [
  { key: 'desktop', label: 'Desktop', width: 1440 },
  { key: 'tablet', label: 'Tablet', width: 768 },
  { key: 'mobile', label: 'Mobile', width: 390 },
]

const DESKTOP_PILL_WIDTH = 160

function pillWidth(v: Viewport) {
  const vp = viewports.find(x => x.key === v)!
  return Math.round((vp.width / 1440) * DESKTOP_PILL_WIDTH)
}

function viewportLabel(v: Viewport) {
  return viewports.find(x => x.key === v)?.label ?? v
}

async function captureOne(viewport: Viewport, hostname: string): Promise<{ img: HTMLImageElement; src: string; filename: string } | null> {
  const state = captureStates.value.find(s => s.viewport === viewport)!
  state.status = 'loading'
  try {
    const res = await fetch('/api/screenshot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: url.value, viewport }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { message?: string }
      throw new Error(err.message || `${res.status}`)
    }
    const blob = await res.blob()
    const src = URL.createObjectURL(blob)
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = reject
      el.src = src
    })
    state.status = 'done'
    state.src = src
    return { img, src, filename: `${hostname}-${viewport}.png` }
  } catch (e: unknown) {
    state.status = 'error'
    return null
  }
}

async function onCapture() {
  if (!url.value || isCapturing.value || selectedViewports.value.length === 0) return
  captureResults.value = []

  let hostname = url.value
  try { hostname = new URL(url.value).hostname } catch {}

  captureStates.value = selectedViewports.value.map(v => ({ viewport: v, status: 'loading' as CaptureStatus }))

  const results = await Promise.all(selectedViewports.value.map(v => captureOne(v, hostname)))
  captureResults.value = results.filter((r): r is NonNullable<typeof r> => r !== null)
}

function onConfirm() {
  if (successful.value.length === 1) {
    emit('loaded', successful.value[0].img, successful.value[0].src, successful.value[0].filename)
  } else if (successful.value.length > 1) {
    emit('batchLoaded', successful.value)
  }
  onClose()
}

function onClose() {
  url.value = ''
  captureStates.value = []
  captureResults.value = []
  emit('close')
}

watch(() => props.open, (val) => {
  if (!val) onClose()
})
</script>
