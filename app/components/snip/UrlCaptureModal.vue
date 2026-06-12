<template>
  <AppModal :open="open" title="Capture from URL" @close="onClose">
    <!-- Pro upsell (non-pro users) -->
    <div v-if="!isPro" class="flex flex-col gap-3">
      <p class="text-sm text-[var(--color-text-muted)]">
        Capturing a screenshot from a live URL is a Pro feature.
      </p>
      <div class="rounded-lg px-3 py-2.5 bg-[var(--color-surface-3)] [border:0.5px_solid_rgba(142,158,173,0.2)]">
        <button
          class="flex h-7 w-full items-center justify-center rounded-md text-xs font-medium transition bg-[var(--color-accent-dim)] text-[var(--color-accent)] [border:0.5px_solid_rgba(142,158,173,0.3)]"
          :disabled="checkoutLoading"
          @click="startCheckout('pro_early')"
        >
          Upgrade to Pro
        </button>
      </div>
    </div>

    <div v-else class="flex flex-col gap-3">
      <p class="text-xs text-[var(--color-text-muted)]">
        Grab a screenshot of a live page to use as a snip source — pick one or more viewports below.
      </p>
      <div class="flex gap-2">
        <input
          v-model="url"
          type="text"
          inputmode="url"
          placeholder="https://example.com"
          :disabled="isCapturing"
          class="h-8 flex-1 rounded-[6px] border bg-white/5 px-3 text-xs text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 focus:ring-white/20 disabled:opacity-40"
          :class="urlError ? 'border-red-400/40' : 'border-white/10'"
          @keydown.enter="onCapture"
        />
        <button
          class="flex h-8 items-center rounded-[6px] border-strong px-3 text-xs text-[var(--color-text)] transition hover:bg-white/5 disabled:opacity-40"
          :disabled="isCapturing || !url || !!urlError || selectedViewports.length === 0"
          @click="onCapture"
        >
          Capture
        </button>
      </div>
      <p v-if="urlError" class="-mt-1 text-[10px] text-red-400">{{ urlError }}</p>

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

      <p v-if="isCapturing" class="text-[10px] text-[var(--color-text-muted)]/70">
        {{ captureProgressHint(elapsedSeconds) }}
      </p>

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
              <AppTooltip :text="state.error || 'Capture failed'">
                <button
                  type="button"
                  class="flex items-center justify-center rounded p-1 text-red-400 transition hover:bg-white/10 hover:text-red-300"
                  :aria-label="`Retry ${viewportLabel(state.viewport)} capture`"
                  @click="retryViewport(state.viewport)"
                >
                  <RotateCwIcon class="size-3.5" />
                </button>
              </AppTooltip>
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
import { Loader2Icon, CheckIcon, XIcon, RotateCwIcon } from 'lucide-vue-next'
import { resolveCaptureUrl, getCaptureHostname, isValidCaptureUrl, useCaptureElapsed, captureProgressHint } from '~/composables/useUrlCapture'
import { useAuthStore } from '~/stores/auth'
import { usePlan } from '~/composables/usePlan'
import { useCheckout } from '~/composables/useCheckout'

type Viewport = 'desktop' | 'tablet' | 'mobile'
type CaptureStatus = 'loading' | 'done' | 'error'

interface CaptureState {
  viewport: Viewport
  status: CaptureStatus
  error?: string
  src?: string
  img?: HTMLImageElement
  filename?: string
}

const props = defineProps<{ open: boolean }>()

const emit = defineEmits<{
  close: []
  loaded: [img: HTMLImageElement, src: string, filename: string]
  batchLoaded: [items: Array<{ img: HTMLImageElement; src: string; filename: string }>]
}>()

const authStore = useAuthStore()
const { isPro } = usePlan()
const { startCheckout, loading: checkoutLoading } = useCheckout()

const url = ref('')
const selectedViewports = ref<Viewport[]>(['desktop', 'tablet', 'mobile'])

const resolvedUrl = computed(() => resolveCaptureUrl(url.value))
const urlError = computed(() => {
  if (!url.value || isValidCaptureUrl(url.value)) return ''
  return 'Enter a valid URL'
})
const captureStates = ref<CaptureState[]>([])
const isCapturing = computed(() => captureStates.value.some(s => s.status === 'loading'))
const { elapsedSeconds, start: startElapsed, stop: stopElapsed } = useCaptureElapsed()
const successful = computed(() => captureStates.value.filter(s => s.status === 'done'))

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

async function captureOne(viewport: Viewport, hostname: string): Promise<void> {
  const state = captureStates.value.find(s => s.viewport === viewport)!
  state.status = 'loading'
  state.error = undefined
  try {
    const res = await fetch('/api/screenshot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authStore.token}` },
      body: JSON.stringify({ url: resolvedUrl.value, viewport }),
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
    state.img = img
    state.filename = `${hostname}-${viewport}.png`
  } catch (e: unknown) {
    state.status = 'error'
    state.error = e instanceof Error ? e.message : 'Capture failed'
  }
}

async function onCapture() {
  if (!url.value || urlError.value || isCapturing.value || selectedViewports.value.length === 0) return

  const hostname = getCaptureHostname(url.value)

  captureStates.value = selectedViewports.value.map(v => ({ viewport: v, status: 'loading' as CaptureStatus }))
  startElapsed()

  await Promise.all(selectedViewports.value.map(v => captureOne(v, hostname)))
  stopElapsed()
}

async function retryViewport(viewport: Viewport) {
  const hostname = getCaptureHostname(url.value)
  startElapsed()
  await captureOne(viewport, hostname)
  stopElapsed()
}

function onConfirm() {
  const items = successful.value.map(s => ({ img: s.img!, src: s.src!, filename: s.filename! }))
  const first = items[0]
  if (items.length === 1 && first) {
    emit('loaded', first.img, first.src, first.filename)
  } else if (items.length > 1) {
    emit('batchLoaded', items)
  }
  onClose()
}

function onClose() {
  url.value = ''
  captureStates.value = []
  stopElapsed()
  emit('close')
}

watch(() => props.open, (val) => {
  if (!val) onClose()
})
</script>
