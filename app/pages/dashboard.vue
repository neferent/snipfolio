<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useProjectStore } from '~/stores/project'
import { useProject } from '~/composables/useProject'
import AppDropdown from '~/components/ui/AppDropdown.vue'
import AppDropdownItem from '~/components/ui/AppDropdownItem.vue'
import {
  captureViewportSSE,
  isValidCaptureUrl,
  resolveCaptureUrl,
  VIEWPORT_SCREEN_ASPECT,
  idleProgress,
  overallProgressPercent,
  useProgressTick,
  type CaptureViewport,
  type ViewportProgress,
} from '~/composables/useUrlCapture'
import { drawPhoneFrame } from '~/components/frames/PhoneFrame'
import { drawTabletFrame } from '~/components/frames/TabletFrame'
import { drawLaptopFrame } from '~/components/frames/LaptopFrame'
import BackgroundControls from '~/components/composition/BackgroundControls.vue'
import CaptionControls from '~/components/composition/CaptionControls.vue'
import AppColorPicker from '~/components/ui/AppColorPicker.vue'
import UserMenu from '~/components/ui/UserMenu.vue'
import StudioFrame from '~/components/studio/StudioFrame.vue'
import { drawBackground, drawCaption, getFrameScreenBounds } from '~/composables/useCanvasRenderer'
import { usePlan } from '~/composables/usePlan'
import { useAuth } from '~/composables/useAuth'
import AppToggleButton from '~/components/ui/AppToggleButton.vue'
import type { BackgroundConfig, CaptionConfig, DeviceFrame } from '~/types'

useHead({ title: 'Studio — Snipfolio' })

const { isPro, captureLimit, capturesRemaining } = usePlan()
const { refreshProfile } = useAuth()

// ---- Auth ----
const authStore = useAuthStore()
const router = useRouter()
onMounted(() => {
  if (!authStore.isAuthenticated && !authStore.isGuest) {
    router.replace('/login')
  }
})

// ---- Projects dropdown ----
const projectStore = useProjectStore()
const { fetchProjects } = useProject()
const recentProjects = computed(() => projectStore.projects.slice(0, 8))
onMounted(() => {
  if (authStore.isAuthenticated) fetchProjects().catch(() => {})
})

// ---- Frame SVG aspect ratios (width/height) ----
const FRAME_SVG_ASPECT: Record<CaptureViewport, number> = {
  desktop: 3809.99 / 2300,
  tablet: 2449.87 / 1877.1,
  mobile: 772.5 / 1600,
}

const DEFAULT_FRAME_WIDTH: Record<CaptureViewport, number> = {
  desktop: 1300,
  tablet: 900,
  mobile: 300,
}

const devices: { id: CaptureViewport; label: string }[] = [
  { id: 'desktop', label: 'Desktop' },
  { id: 'tablet', label: 'Tablet' },
  { id: 'mobile', label: 'Mobile' },
]

// ---- Device toggles ----
const activeDevices = ref<CaptureViewport[]>(['desktop'])
const selectedDevice = ref<CaptureViewport | null>('desktop')

function isActive(d: CaptureViewport) {
  return activeDevices.value.includes(d)
}

// Fixed z-/draw-order: desktop sits behind, tablet and mobile layer in front so
// their edges can overlap the laptop like in the reference mockups.
const RENDER_ORDER: CaptureViewport[] = ['desktop', 'tablet', 'mobile']
const orderedActiveDevices = computed(() => RENDER_ORDER.filter((d) => activeDevices.value.includes(d)))

function toggleDevice(d: CaptureViewport) {
  if (isActive(d)) {
    if (activeDevices.value.length === 1) return // keep at least one device active
    activeDevices.value = activeDevices.value.filter((x) => x !== d)
    if (selectedDevice.value === d) selectedDevice.value = activeDevices.value[0] ?? null
  } else {
    activeDevices.value = [...activeDevices.value, d]
    selectedDevice.value = d
  }
  nextTick(() => { arrangeFrames(); updateAreaSize() })
}

// ---- Per-device frame state (output pixel coordinates) ----
interface FrameState {
  x: number
  y: number
  width: number
  frameColor: string
  scrollOffset: number
  capturedImage: HTMLImageElement | null
  caption: CaptionConfig | undefined
}

function makeFrameState(d: CaptureViewport): FrameState {
  return {
    x: 0,
    y: 0,
    width: DEFAULT_FRAME_WIDTH[d],
    frameColor: '#262c44',
    scrollOffset: 0,
    capturedImage: null,
    caption: undefined,
  }
}

const frameState = reactive<Record<CaptureViewport, FrameState>>({
  desktop: makeFrameState('desktop'),
  tablet: makeFrameState('tablet'),
  mobile: makeFrameState('mobile'),
})

function frameHeight(d: CaptureViewport) {
  return frameState[d].width / FRAME_SVG_ASPECT[d]
}

// Map CaptureViewport → DeviceFrame for caption/screen-bounds lookup
function deviceFrameFor(d: CaptureViewport): DeviceFrame {
  if (d === 'mobile') return 'phone'
  if (d === 'tablet') return 'tablet'
  return 'laptop'
}

function maxScrollOffsetFor(d: CaptureViewport) {
  const img = frameState[d].capturedImage
  if (!img) return 0
  const vw = img.naturalWidth
  const vh = Math.round(vw / VIEWPORT_SCREEN_ASPECT[d])
  return Math.max(0, img.naturalHeight - vh)
}

/** Lays out all active frames. A single device is just centered; two or three overlap like the classic device-mockup layout. */
function arrangeFrames() {
  const ds = orderedActiveDevices.value
  if (ds.length === 0) return

  if (ds.length === 1) {
    centerFrame(ds[0]!)
    return
  }

  arrangeOverlapGroup(ds)
}

// ---- Default layout tuning knobs ----
// Everything below controls the size/position of the desktop/tablet/mobile mockup
// layouts (arrangeOverlapGroup, used for any 2- or 3-device combo). Change one of
// these and every combo that includes that device updates consistently — there's
// no per-combo layout code to hunt through.
//
//   UNIT_HEIGHT     — each device's height relative to the laptop (laptop is fixed
//                      at 1). Raise a number to make that device bigger relative to
//                      the others; e.g. mobile: 0.7 means the phone frame is 70% of
//                      the laptop's height. Width follows automatically from
//                      FRAME_SVG_ASPECT, so you never set width directly.
//   OVERLAP_FRACTION — how much of a "front" device's own width tucks behind the
//                      device it overlaps (0 = edge-to-edge, no overlap; 1 = fully
//                      hidden). Applies to every front device; split it into a
//                      per-device Record<CaptureViewport, number> if a device ever
//                      needs its own overlap amount.
//   OVERLAP_SIDE     — which side of the anchor each device sits on ('left' or
//                      'right'). The anchor itself (desktop, or tablet if desktop
//                      isn't active — see RENDER_ORDER) doesn't need an entry, it's
//                      always centered.
//   marginRatio      — set inside arrangeOverlapGroup below. Fraction of the output
//                      canvas the whole group is allowed to fill (0.96 = up to 4%
//                      breathing room on whichever axis is the tighter fit). Raise
//                      it to make everything bigger; the group still scales down to
//                      avoid clipping on canvases with an unusual aspect ratio.
//
// All three devices are always bottom-aligned to one shared line, so changing a
// height ratio never needs a matching y-offset tweak.
const UNIT_HEIGHT: Record<CaptureViewport, number> = {
  desktop: 1,
  tablet: 0.666,
  mobile: 0.7,
}
const OVERLAP_FRACTION = 0.35
const OVERLAP_SIDE: Partial<Record<CaptureViewport, 'left' | 'right'>> = {
  mobile: 'left',
  tablet: 'right',
}

/**
 * Matches the classic "bigger device centered, smaller devices in front overlapping its
 * edges" mockup for any 2- or 3-device combo. The device earliest in RENDER_ORDER (i.e.
 * desktop, else tablet) is the anchor and stays centered/back; the rest sit in front,
 * bottom-aligned, overlapping the anchor's left/right edge.
 */
function arrangeOverlapGroup(ds: CaptureViewport[]) {
  const [anchor, ...fronts] = RENDER_ORDER.filter((d) => ds.includes(d))
  if (!anchor) return

  const unitOf = (d: CaptureViewport) => ({ h: UNIT_HEIGHT[d], w: UNIT_HEIGHT[d] * FRAME_SVG_ASPECT[d] })
  const anchorU = unitOf(anchor)

  let leftExtra = 0
  let rightExtra = 0
  const frontUnits = new Map<CaptureViewport, { h: number; w: number; overlap: number }>()
  for (const f of fronts) {
    const u = unitOf(f)
    const overlap = u.w * OVERLAP_FRACTION
    frontUnits.set(f, { ...u, overlap })
    if (OVERLAP_SIDE[f] === 'left') leftExtra = u.w - overlap
    else rightExtra = u.w - overlap
  }

  const totalW = leftExtra + anchorU.w + rightExtra
  const totalH = Math.max(anchorU.h, ...fronts.map((f) => frontUnits.get(f)!.h))

  const marginRatio = 0.96
  const scale = Math.min((outputWidth.value * marginRatio) / totalW, (outputHeight.value * marginRatio) / totalH)

  const AW = anchorU.w * scale, AH = anchorU.h * scale
  const groupW = totalW * scale
  const groupLeft = (outputWidth.value - groupW) / 2
  const bottom = (outputHeight.value + totalH * scale) / 2

  const anchorX = groupLeft + leftExtra * scale
  frameState[anchor].width = Math.round(AW)
  frameState[anchor].x = Math.round(anchorX)
  frameState[anchor].y = Math.round(bottom - AH)

  for (const f of fronts) {
    const u = frontUnits.get(f)!
    const FW = u.w * scale, FH = u.h * scale, FOverlap = u.overlap * scale
    const x = OVERLAP_SIDE[f] === 'left' ? anchorX - FW + FOverlap : anchorX + AW - FOverlap
    frameState[f].width = Math.round(FW)
    frameState[f].x = Math.round(x)
    frameState[f].y = Math.round(bottom - FH)
  }
}

function centerFrame(d: CaptureViewport) {
  frameState[d].x = Math.round((outputWidth.value - frameState[d].width) / 2)
  frameState[d].y = Math.round((outputHeight.value - frameHeight(d)) / 2)
}

// ---- Capture state (per device) ----
const url = ref('')
const captureState = reactive<Record<CaptureViewport, { isCapturing: boolean; progress: ViewportProgress; error: string | null }>>({
  desktop: { isCapturing: false, progress: idleProgress(), error: null },
  tablet: { isCapturing: false, progress: idleProgress(), error: null },
  mobile: { isCapturing: false, progress: idleProgress(), error: null },
})
const abortCtrl = ref<AbortController | null>(null)
const { now: tickNow, start: startTick, stop: stopTick } = useProgressTick()

const isCapturing = computed(() => activeDevices.value.some((d) => captureState[d].isCapturing))
const captureProgressPct = computed(() =>
  overallProgressPercent(activeDevices.value.map((d) => captureState[d].progress), tickNow.value),
)
const captureErrors = computed(() => activeDevices.value.map((d) => captureState[d].error).filter((e): e is string => !!e))
const hasAnyCapture = computed(() => activeDevices.value.some((d) => frameState[d].capturedImage))

const captureLimitReached = computed(() =>
  authStore.profileLoaded && capturesRemaining.value <= 0,
)

async function captureOne(d: CaptureViewport, resolvedUrl: string) {
  captureState[d].isCapturing = true
  captureState[d].error = null
  captureState[d].progress = { phase: 'connecting', phaseStartedAt: Date.now() }
  try {
    const token = authStore.token
    if (!token) throw new Error('Not signed in')
    const { img } = await captureViewportSSE(
      resolvedUrl,
      d,
      token,
      (p) => { captureState[d].progress = p },
      abortCtrl.value?.signal,
    )
    frameState[d].capturedImage = img
    frameState[d].scrollOffset = 0
  } catch (err: any) {
    if (err?.name !== 'AbortError') captureState[d].error = err?.message || 'Capture failed'
  } finally {
    captureState[d].isCapturing = false
  }
}

async function capture() {
  if (!isValidCaptureUrl(url.value) || isCapturing.value || captureLimitReached.value) return
  abortCtrl.value?.abort()
  abortCtrl.value = new AbortController()
  startTick()

  try {
    const resolvedUrl = resolveCaptureUrl(url.value)
    for (const d of activeDevices.value) {
      await captureOne(d, resolvedUrl)
    }
    await nextTick()
    arrangeFrames()
  } finally {
    stopTick()
    refreshProfile()
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') capture()
}

// ---- Output / canvas ----
const outputWidth = ref(1920)
const outputHeight = ref(1080)

const background = ref<BackgroundConfig>({
  type: 'solid',
  color: '#f0f1f5',
  gradientStart: '#667eea',
  gradientEnd: '#764ba2',
  gradientAngle: 135,
  noiseOpacity: 0,
})

const loadedBgImage = ref<HTMLImageElement | undefined>()
watch(
  () => background.value,
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

// ---- View scale (display px per output px) ----
// The artboard must always fit entirely within the canvas area (contain-fit),
// shrinking or growing on both axes as outputWidth/outputHeight or the
// available area change — never just stretching to the container's width.
const canvasArea = ref<HTMLElement | null>(null)
const areaW = ref(900)
const areaH = ref(600)
let areaResizeObserver: ResizeObserver | undefined

function updateAreaSize() {
  if (!canvasArea.value) return
  areaW.value = canvasArea.value.clientWidth
  areaH.value = canvasArea.value.clientHeight
}

const CANVAS_PADDING = 24

const viewScale = computed(() => {
  const availW = Math.max(1, areaW.value - CANVAS_PADDING)
  const availH = Math.max(1, areaH.value - CANVAS_PADDING)
  return Math.min(availW / outputWidth.value, availH / outputHeight.value)
})

const canvasDisplayW = computed(() => Math.round(outputWidth.value * viewScale.value))
const canvasDisplayH = computed(() => Math.round(outputHeight.value * viewScale.value))

onMounted(() => {
  updateAreaSize()
  window.addEventListener('resize', updateAreaSize)
  if (canvasArea.value) {
    areaResizeObserver = new ResizeObserver(() => updateAreaSize())
    areaResizeObserver.observe(canvasArea.value)
  }
})
onUnmounted(() => {
  window.removeEventListener('resize', updateAreaSize)
  areaResizeObserver?.disconnect()
  abortCtrl.value?.abort()
})

// ---- Full-output canvas rendering (background + frames together, like the composer) ----
const outputCanvas = ref<HTMLCanvasElement | null>(null)

// ---- Export ----
function createScrolledViewport(img: HTMLImageElement, offset: number, aspect: number): HTMLCanvasElement {
  const vw = img.naturalWidth
  const vh = Math.round(vw / aspect)
  const y = Math.min(Math.max(0, Math.round(offset)), Math.max(0, img.naturalHeight - vh))
  const c = document.createElement('canvas')
  c.width = vw
  c.height = Math.max(1, vh)
  c.getContext('2d')!.drawImage(img, 0, y, vw, vh, 0, 0, vw, vh)
  return c
}

function drawFrameOnto(ctx: CanvasRenderingContext2D, d: CaptureViewport) {
  const fs = frameState[d]
  if (!fs.capturedImage) return
  const viewport = createScrolledViewport(fs.capturedImage, fs.scrollOffset, VIEWPORT_SCREEN_ASPECT[d])
  const fw = fs.width
  const fh = frameHeight(d)
  const fx = fs.x
  const fy = fs.y
  const fc = fs.frameColor

  if (d === 'mobile') drawPhoneFrame(ctx, fx, fy, fw, fh, viewport, fc)
  else if (d === 'tablet') drawTabletFrame(ctx, fx, fy, fw, fh, viewport, fc)
  else drawLaptopFrame(ctx, fx, fy, fw, fh, viewport, fc)

  if (fs.caption) {
    const scr = getFrameScreenBounds(deviceFrameFor(d), fx, fy, fw, fh)
    drawCaption(ctx, fs.caption, scr.x, scr.y, scr.w, scr.h, scr.r)
  }
}

async function doExport() {
  if (!hasAnyCapture.value) return

  const c = document.createElement('canvas')
  c.width = outputWidth.value
  c.height = outputHeight.value
  const ctx = c.getContext('2d')!

  drawBackground(ctx, c.width, c.height, background.value, undefined, loadedBgImage.value)
  for (const d of orderedActiveDevices.value) drawFrameOnto(ctx, d)

  const link = document.createElement('a')
  link.download = 'snipfolio.png'
  link.href = c.toDataURL('image/png')
  link.click()
}

// ---- Live preview canvas (renders background + frames into one canvas, like the composer) ----
function renderCanvas() {
  const c = outputCanvas.value
  if (!c) return
  const W = outputWidth.value
  const H = outputHeight.value
  c.width = W
  c.height = H
  const ctx = c.getContext('2d')!
  ctx.clearRect(0, 0, W, H)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  if (hasAnyCapture.value) {
    drawBackground(ctx, W, H, background.value, undefined, loadedBgImage.value)
    for (const d of orderedActiveDevices.value) drawFrameOnto(ctx, d)
  }
}

watch(
  [activeDevices, frameState, outputWidth, outputHeight, background, loadedBgImage],
  () => nextTick(renderCanvas),
  { deep: true },
)


onMounted(() => nextTick(renderCanvas))

// ---- Output size input ----
function setOutputWidth(e: Event) {
  const v = parseInt((e.target as HTMLInputElement).value)
  if (!isNaN(v)) outputWidth.value = Math.max(400, Math.min(4000, v))
  nextTick(updateAreaSize)
}
function setOutputHeight(e: Event) {
  const v = parseInt((e.target as HTMLInputElement).value)
  if (!isNaN(v)) outputHeight.value = Math.max(300, Math.min(3000, v))
}
</script>

<template>
  <div class="flex h-screen flex-col overflow-hidden bg-[var(--color-surface)] text-[var(--color-text)]">

    <!-- Top bar (matches advanced editor nav) -->
    <header class="flex h-12 w-full shrink-0 items-center border-b border-[var(--color-border)] bg-[var(--color-surface-2)] px-4">
      <div class="mx-auto flex w-full max-w-[1360px] items-center gap-2">
        <AppLogo />

        <!-- Projects dropdown -->
        <AppDropdown align="left">
          <template #trigger>
            <button class="flex items-center gap-1 rounded-[6px] px-2 py-1 text-xs text-[var(--color-text-muted)] transition hover:bg-overlay/5 hover:text-[var(--color-text)]">
              Projects
              <svg class="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </template>
          <div v-if="recentProjects.length === 0" class="px-2.5 py-1.5 text-xs text-[var(--color-text-muted)]">
            No projects yet
          </div>
          <AppDropdownItem
            v-for="p in recentProjects"
            :key="p.id"
            @click="navigateTo(`/advanced/${p.id}`)"
          >
            {{ p.name }}
          </AppDropdownItem>
          <div class="my-0.5 h-px bg-[var(--color-border)]" />
          <AppDropdownItem @click="navigateTo('/projects')">View all projects →</AppDropdownItem>
        </AppDropdown>

        <div class="flex-1" />

        <NuxtLink
          to="/projects"
          class="flex h-8 items-center gap-1.5 rounded-[6px] border-strong px-3 text-xs font-medium text-[var(--color-text)] transition hover:bg-overlay/5"
        >
          Advanced Editor
          <svg class="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </NuxtLink>
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>

    <!-- Main content -->
    <div class="flex flex-1 justify-center overflow-hidden p-4">
      <div class="mx-auto flex w-full max-w-[1360px] flex-col gap-4 overflow-hidden">

        <!-- Canvas + settings row -->
        <div class="flex flex-1 gap-4 overflow-hidden">

          <!-- Canvas area -->
          <div
            ref="canvasArea"
            class="flex flex-1 flex-col items-center overflow-hidden"
          >
            <!-- Artboard: single canvas renders background + frames (shadows bleed onto background).
                 Dot grid is the artboard's own default backdrop, showing through until there's a capture.
                 Sized to contain-fit the canvas area on both axes so the whole output is always visible. -->
            <div
              class="bg-dot-grid relative"
              :class="hasAnyCapture ? 'shadow-2xl' : 'border border-[var(--color-border-strong)]'"
              :style="{ width: `${canvasDisplayW}px`, height: `${canvasDisplayH}px`, flexShrink: 0 }"
            >
              <canvas
                ref="outputCanvas"
                class="pointer-events-none absolute inset-0 h-full w-full"
              />

              <!-- Empty state: capture form, shown until the first device image lands -->
              <div
                v-if="!hasAnyCapture"
                class="absolute inset-0 z-20 flex flex-col items-center justify-center p-6"
              >
                <div class="flex w-full max-w-md flex-col gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-6 shadow-xl">
                  <div class="flex flex-col items-center gap-1 text-center">
                    <p class="text-sm font-medium text-[var(--color-text)]">Capture a website to get started</p>
                    <p class="text-xs text-[var(--color-text-muted)]">Enter a URL and choose which device viewports to capture</p>
                  </div>

                  <!-- Device toggles -->
                  <div class="flex justify-center gap-1">
                    <AppToggleButton
                      v-for="d in devices"
                      :key="d.id"
                      :model-value="isActive(d.id)"
                      size="sm"
                      @update:model-value="toggleDevice(d.id)"
                    >
                      {{ d.label }}
                    </AppToggleButton>
                  </div>

                  <!-- URL input -->
                  <div class="flex flex-col gap-2">
                    <AppInput
                      v-model="url"
                      type="text"
                      placeholder="Enter a URL to capture…"
                      class="w-full"
                      @keydown="onKeydown"
                    />
                    <AppButton
                      class="w-full"
                      :disabled="!isValidCaptureUrl(url) || isCapturing || captureLimitReached"
                      @click="capture"
                    >
                      {{ isCapturing ? 'Capturing…' : `Capture ${activeDevices.length > 1 ? 'all' : ''}` }}
                    </AppButton>
                  </div>

                  <!-- Progress bar -->
                  <div v-if="isCapturing" class="h-1 w-full overflow-hidden rounded-full bg-overlay/10">
                    <div
                      class="h-full rounded-full bg-[var(--color-accent)] transition-all duration-300"
                      :style="{ width: `${captureProgressPct}%` }"
                    />
                  </div>

                  <div v-if="!isPro && authStore.profileLoaded" class="text-center text-[11px] text-[var(--color-text-muted)]">
                    {{ capturesRemaining }}/{{ captureLimit }} free captures left
                  </div>

                  <div v-if="captureErrors.length" class="text-center text-xs text-red-400">{{ captureErrors[0] }}</div>
                </div>
              </div>

              <!-- Interaction overlays (drag, resize, scroll — no rendering) — one per active device -->
              <StudioFrame
                v-for="d in orderedActiveDevices"
                :key="d"
                :class="selectedDevice === d ? 'z-10' : ''"
                :x="frameState[d].x"
                :y="frameState[d].y"
                :width="frameState[d].width"
                :height="frameHeight(d)"
                :scroll-offset="frameState[d].scrollOffset"
                :max-scroll-offset="maxScrollOffsetFor(d)"
                :view-scale="viewScale"
                :svg-aspect="FRAME_SVG_ASPECT[d]"
                @mousedown.capture="selectedDevice = d"
                @update:x="frameState[d].x = $event"
                @update:y="frameState[d].y = $event"
                @update:width="frameState[d].width = $event"
                @update:scroll-offset="frameState[d].scrollOffset = $event"
              />
            </div>
          </div>

          <!-- Sidebar panel -->
          <aside class="flex w-72 shrink-0 flex-col gap-0 overflow-y-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)]">

            <!-- Frame -->
            <div class="border-b border-[var(--color-border)] p-4 space-y-3">
              <p class="text-[12px] font-medium tracking-wider uppercase text-[var(--color-text-faint)]">Frame</p>

              <!-- Device tabs (only when more than one active) -->
              <div v-if="activeDevices.length > 1" class="flex gap-1">
                <button
                  v-for="d in orderedActiveDevices"
                  :key="d"
                  class="rounded px-2 py-1 text-xs transition"
                  :class="selectedDevice === d
                    ? 'bg-[var(--color-accent)] text-white'
                    : 'text-[var(--color-text-muted)] hover:bg-overlay/5 hover:text-[var(--color-text)]'"
                  @click="selectedDevice = d"
                >
                  {{ devices.find((x) => x.id === d)?.label }}
                </button>
              </div>

              <template v-if="selectedDevice">
                <!-- Frame color -->
                <div class="flex items-center gap-2">
                  <label class="text-xs text-[var(--color-text-muted)]">Color</label>
                  <AppColorPicker v-model="frameState[selectedDevice].frameColor" />
                  <AppButton variant="ghost" size="sm" @click="frameState[selectedDevice].frameColor = '#262c44'">
                    Reset
                  </AppButton>
                </div>

                <!-- Center frame -->
                <AppButton variant="secondary" size="sm" class="w-full" @click="centerFrame(selectedDevice)">
                  Center frame
                </AppButton>
              </template>
            </div>

            <!-- Canvas -->
            <div class="border-b border-[var(--color-border)] p-4 space-y-3">
              <p class="text-[12px] font-medium tracking-wider uppercase text-[var(--color-text-faint)]">Canvas</p>

              <!-- Output size -->
              <div class="flex items-center gap-2">
                <AppInput
                  type="number"
                  :model-value="outputWidth"
                  min="400"
                  max="4000"
                  class="w-full"
                  @change="setOutputWidth"
                />
                <span class="text-xs text-[var(--color-text-muted)]">×</span>
                <AppInput
                  type="number"
                  :model-value="outputHeight"
                  min="300"
                  max="3000"
                  class="w-full"
                  @change="setOutputHeight"
                />
              </div>

              <!-- Common presets -->
              <div class="flex flex-wrap gap-1">
                <button
                  v-for="preset in (([[1920, 1080], [1280, 800], [1080, 1080]] as [number, number][]))"
                  :key="`${preset[0]}x${preset[1]}`"
                  class="rounded px-2 py-0.5 text-[10px] text-[var(--color-text-muted)] border border-[var(--color-border)] hover:bg-overlay/5 transition"
                  @click="() => { outputWidth = preset[0]; outputHeight = preset[1]; nextTick(updateAreaSize) }"
                >
                  {{ preset[0] }}×{{ preset[1] }}
                </button>
              </div>
            </div>

            <!-- Caption -->
            <div v-if="selectedDevice" class="border-b border-[var(--color-border)] p-4">
              <CaptionControls
                label="Caption"
                :model-value="frameState[selectedDevice].caption"
                @update:model-value="frameState[selectedDevice].caption = $event"
              />
            </div>

            <!-- Background -->
            <div class="border-b border-[var(--color-border)] p-4">
              <p class="mb-3 text-[12px] font-medium tracking-wider uppercase text-[var(--color-text-faint)]">Background</p>
              <BackgroundControls v-model="background" />
            </div>

            <!-- Export -->
            <div class="p-4 mt-auto">
              <AppButton size="lg" class="w-full" :disabled="!hasAnyCapture" @click="doExport">
                Export PNG
              </AppButton>
            </div>
          </aside>

        </div>
      </div>
    </div>
  </div>
</template>
