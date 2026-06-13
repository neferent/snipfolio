<template>
  <AppModal :open="open" :title="modalTitle" @close="onClose">
    <!-- Main: name + project type -->
    <div v-if="step === 'main'" class="space-y-3">
      <div class="space-y-1.5">
        <label class="text-xs font-medium text-[var(--color-text-muted)]">Project name</label>
        <input
          ref="nameInputRef"
          v-model="name"
          class="w-full"
          :placeholder="type === 'url' ? 'example.com' : 'My project'"
          @focus="nameFocused = true"
          @blur="nameFocused = false"
          @keydown.enter="onSubmitMain"
        />
      </div>

      <div class="grid gap-3" :class="URL_CAPTURE_ENABLED ? 'grid-cols-2' : 'grid-cols-1'">
        <button
          class="flex flex-col gap-2 rounded-lg border p-4 text-left transition hover:bg-white/5"
          :class="type === 'blank' ? 'border-[#8e9ead]/60 bg-white/5' : 'border-white/10 hover:border-white/20'"
          @click="type = 'blank'"
        >
          <span class="text-sm font-medium text-[var(--color-text)]">Blank</span>
          <span class="text-xs text-[var(--color-text-muted)]">Start empty, add screenshots manually</span>
        </button>
        <button
          v-if="URL_CAPTURE_ENABLED"
          class="flex flex-col gap-2 rounded-lg border p-4 text-left transition hover:bg-white/5"
          :class="type === 'url' ? 'border-[#8e9ead]/60 bg-white/5' : 'border-white/10 hover:border-white/20'"
          @click="type = 'url'"
        >
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium text-[var(--color-text)]">From URL</span>
            <span class="rounded px-1.5 py-0.5 text-[10px] font-semibold bg-[var(--color-accent)]/20 text-[var(--color-accent)]">Pro</span>
          </div>
          <span class="text-xs text-[var(--color-text-muted)]">Capture desktop &amp; mobile, compose instantly</span>
        </button>
      </div>

      <Transition name="expand" @enter="onExpandEnter" @after-enter="onExpandAfterEnter" @leave="onExpandLeave">
        <!-- URL entry, shown when "From URL" is selected and the user is Pro -->
        <div v-if="type === 'url' && isPro" key="url-pro" class="expand-panel space-y-1.5">
          <label class="mt-3 block text-xs font-medium text-[var(--color-text-muted)]">URL</label>
          <input
            ref="urlInputRef"
            v-model="url"
            type="text"
            inputmode="url"
            class="w-full"
            :class="urlError ? 'border-red-400/40' : ''"
            placeholder="https://example.com"
            @input="onUrlInput"
            @keydown.enter="onSubmitMain"
          />
          <p v-if="urlError" class="text-[10px] text-red-400">{{ urlError }}</p>
          <p class="text-xs text-[var(--color-text-muted)]">Choose what to capture on the next step</p>
        </div>

        <!-- Pro upsell, shown when "From URL" is selected and the user is not Pro -->
        <div v-else-if="type === 'url' && !isPro" key="url-locked" class="expand-panel space-y-3">
          <p class="mt-3 text-sm text-[var(--color-text-muted)]">
            Capturing a project from a live URL is a Pro feature.
          </p>
        </div>
      </Transition>
    </div>

    <!-- Step 2: Preset selection -->
    <div v-else-if="step === 'preset'" class="space-y-3">
      <p class="text-xs text-[var(--color-text-muted)]">Choose what to capture for {{ displayHostname }}</p>
      <div class="grid grid-cols-2 gap-3">
        <button
          v-for="p in CAPTURE_PRESETS"
          :key="p.id"
          type="button"
          class="flex flex-col items-center gap-2 rounded-lg border p-3 text-center transition hover:bg-white/5"
          :class="preset === p.id ? 'border-[#8e9ead]/60 bg-white/5' : 'border-white/10 hover:border-white/20'"
          @click="preset = p.id"
        >
          <CapturePresetThumbnail :preset="p.id" />
          <span class="text-xs font-medium text-[var(--color-text)]">{{ p.label }}</span>
          <span class="text-[10px] text-[var(--color-text-muted)]">{{ p.description }}</span>
        </button>
      </div>
    </div>

    <!-- Step 3: Capturing -->
    <div v-else-if="step === 'capturing'" class="space-y-1">
      <p class="text-xs text-[var(--color-text-muted)]">
        {{ captureError ? 'Capture failed' : captureStageLabel(elapsedSeconds) }}
      </p>
      <div v-if="!captureError" class="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/5">
        <div
          class="h-full rounded-full bg-[var(--color-accent)] transition-[width] duration-1000 ease-linear"
          :style="{ width: captureProgressPercent(elapsedSeconds) + '%' }"
        />
      </div>
      <div class="flex items-end gap-2 pt-2">
        <div
          v-for="viewport in activeViewports"
          :key="viewport"
          class="flex flex-col overflow-hidden rounded border border-white/10"
          :style="{ width: pillWidth(viewport) + 'px' }"
        >
          <div class="relative flex items-center justify-center bg-black/20" style="height: 140px;">
            <Loader2Icon v-if="captureState[viewport].status === 'loading'" class="size-4 animate-spin text-white/30" />
            <img
              v-else-if="captureState[viewport].status === 'done' && captureState[viewport].src"
              :src="captureState[viewport].src"
              class="absolute inset-0 block w-full object-cover object-top"
              draggable="false"
            />
            <XIcon v-else-if="captureState[viewport].status === 'error'" class="size-4 text-red-400" />
          </div>
          <div class="flex items-center gap-1 border-t border-white/10 px-1.5 py-1">
            <CheckIcon v-if="captureState[viewport].status === 'done'" class="size-3 shrink-0 text-emerald-400" />
            <Loader2Icon v-else-if="captureState[viewport].status === 'loading'" class="size-3 shrink-0 animate-spin text-white/30" />
            <XIcon v-else-if="captureState[viewport].status === 'error'" class="size-3 shrink-0 text-red-400" />
            <span class="truncate text-[10px] text-[var(--color-text-muted)]">{{ VIEWPORT_LABEL[viewport] }}</span>
          </div>
        </div>
      </div>
      <div v-if="!captureError" class="pt-2 text-center">
        <button
          type="button"
          class="text-xs text-[var(--color-text-muted)] transition hover:text-[var(--color-text)]"
          @click="onCancelCapture"
        >
          Cancel
        </button>
      </div>
      <p v-if="captureError" class="pt-1 text-xs text-red-400">{{ captureError }}</p>
    </div>

    <template #footer>
      <!-- Main step -->
      <template v-if="step === 'main'">
        <Transition name="fade" mode="out-in">
          <button
            v-if="type === 'url' && !isPro"
            key="upgrade"
            class="flex h-8 items-center rounded-[6px] bg-[var(--color-accent-dim)] px-4 text-sm font-medium text-[var(--color-accent)] transition [border:0.5px_solid_rgba(142,158,173,0.3)] disabled:opacity-50"
            :disabled="checkoutLoading"
            @click="startCheckout('pro_early')"
          >
            Upgrade to Pro
          </button>
          <button
            v-else
            key="submit"
            class="flex h-8 items-center rounded-[6px] bg-[var(--color-accent)] px-4 text-sm font-medium text-[var(--color-on-accent)] transition hover:bg-[var(--color-accent-hover)] hover:text-[var(--color-text)] disabled:opacity-50"
            :disabled="!canSubmit"
            @click="onSubmitMain"
          >
            {{ type === 'url' ? 'Next' : 'Create' }}
          </button>
        </Transition>
      </template>

      <!-- Step 2: preset selection -->
      <template v-else-if="step === 'preset'">
        <button
          class="flex h-8 items-center rounded-[6px] px-3 text-sm text-[var(--color-text-muted)] transition hover:bg-white/5"
          @click="step = 'main'"
        >
          Back
        </button>
        <button
          class="flex h-8 items-center rounded-[6px] bg-[var(--color-accent)] px-4 text-sm font-medium text-[var(--color-on-accent)] transition hover:bg-[var(--color-accent-hover)] hover:text-[var(--color-text)]"
          @click="onStartCapture"
        >
          Capture &amp; Create
        </button>
      </template>

      <!-- Step 3: capturing — only show buttons on error -->
      <template v-else-if="step === 'capturing' && captureError">
        <button
          class="flex h-8 items-center rounded-[6px] px-3 text-sm text-[var(--color-text-muted)] transition hover:bg-white/5"
          @click="step = 'main'"
        >
          Back
        </button>
        <button
          class="flex h-8 items-center rounded-[6px] bg-[var(--color-accent)] px-4 text-sm font-medium text-[var(--color-on-accent)] transition hover:bg-[var(--color-accent-hover)] hover:text-[var(--color-text)]"
          @click="onStartCapture"
        >
          Retry
        </button>
      </template>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { Loader2Icon, CheckIcon, XIcon } from 'lucide-vue-next'
import { resolveCaptureUrl, getCaptureHostname, isValidCaptureUrl, useCaptureElapsed, captureStageLabel, captureProgressPercent, CAPTURE_PRESETS } from '~/composables/useUrlCapture'
import type { CapturePreset, CaptureViewport } from '~/composables/useUrlCapture'
import { useProject } from '~/composables/useProject'
import { useProjectStore } from '~/stores/project'
import { useSourcesStore } from '~/stores/sources'
import { useSnipsStore } from '~/stores/snips'
import { useCompositionsStore } from '~/stores/compositions'
import { useSnips } from '~/composables/useSnips'
import { useCompositions } from '~/composables/useCompositions'
import { useAuthStore } from '~/stores/auth'
import { usePlan } from '~/composables/usePlan'
import { useCheckout } from '~/composables/useCheckout'
import type { SourceImage } from '~/types'

// Screen area aspect ratios (width/height) matching the SVG frame definitions
const LAPTOP_SCREEN_ASPECT = 3034.7 / 1964.07  // ≈ 1.545
const TABLET_SCREEN_ASPECT = (2377.7 - 79.14) / (1803.11 - 80.08)  // ≈ 1.334
const PHONE_SCREEN_ASPECT  = 709.65 / 1539.77  // ≈ 0.461

const VIEWPORT_SCREEN_ASPECT: Record<CaptureViewport, number> = {
  desktop: LAPTOP_SCREEN_ASPECT,
  tablet: TABLET_SCREEN_ASPECT,
  mobile: PHONE_SCREEN_ASPECT,
}
const VIEWPORT_SNAP_FRAME: Record<CaptureViewport, 'laptop' | 'tablet' | 'phone'> = {
  desktop: 'laptop',
  tablet: 'tablet',
  mobile: 'phone',
}
const VIEWPORT_LABEL: Record<CaptureViewport, string> = {
  desktop: 'Desktop',
  tablet: 'Tablet',
  mobile: 'Mobile',
}

// Matches the screenshot service's MAX_CONCURRENT_CAPTURES — exceeding it returns a 429.
const MAX_CONCURRENT_CAPTURES = 2

type Step = 'main' | 'preset' | 'capturing'
type ProjectType = 'blank' | 'url'
type CaptureStatus = 'idle' | 'loading' | 'done' | 'error'

const props = defineProps<{ open: boolean; openToUrl?: boolean }>()
const emit = defineEmits<{
  close: []
  created: [projectId: string]
  composed: [projectId: string, compositionId: string]
}>()

const { createProject: createProjectFn, saveImage, persistAll } = useProject()
const projectStore = useProjectStore()
const sourcesStore = useSourcesStore()
const snipsStore = useSnipsStore()
const compositionsStore = useCompositionsStore()
const { createSnip } = useSnips()
const { createLaptopPhoneComposition, createLaptopTabletPhoneComposition, createBrowserComposition, createLaptopComposition } = useCompositions()
const authStore = useAuthStore()
const { isPro } = usePlan()
const { startCheckout, loading: checkoutLoading } = useCheckout()

const step = ref<Step>('main')
const type = ref<ProjectType>('blank')
const name = ref('')
const url = ref('')
const nameFocused = ref(false)
const prevHostname = ref('')
const preset = ref<CapturePreset>('laptop+phone')

const captureState = reactive<Record<CaptureViewport, { status: CaptureStatus; src: string }>>({
  desktop: { status: 'idle', src: '' },
  tablet: { status: 'idle', src: '' },
  mobile: { status: 'idle', src: '' },
})
const captureError = ref('')
const { elapsedSeconds, start: startElapsed, stop: stopElapsed } = useCaptureElapsed()

let captureAbortController: AbortController | null = null
let captureCancelled = false

const nameInputRef = ref<HTMLInputElement>()
const urlInputRef = ref<HTMLInputElement>()

const resolvedUrl = computed(() => resolveCaptureUrl(url.value))
const displayHostname = computed(() => getCaptureHostname(url.value))
const urlError = computed(() => {
  if (!url.value || isValidCaptureUrl(url.value)) return ''
  return 'Enter a valid URL'
})

const modalTitle = computed(() => {
  if (step.value === 'capturing') return captureError.value ? 'Capture failed' : `Capturing ${displayHostname.value}…`
  if (step.value === 'preset') return 'Choose a layout'
  return 'New Project'
})

const canSubmit = computed(() => {
  if (!name.value.trim()) return false
  if (type.value === 'url') return isPro.value && !!resolvedUrl.value && !urlError.value
  return true
})

const activeViewports = computed(() => CAPTURE_PRESETS.find((p) => p.id === preset.value)?.viewports ?? [])

/** Pill width for a capture-progress preview, sized proportionally to the preset's viewport mix. */
function pillWidth(viewport: CaptureViewport): number {
  const n = activeViewports.value.length
  if (n === 1) return 320
  if (n === 2) return viewport === 'mobile' ? 65 : 240
  if (viewport === 'desktop') return 170
  if (viewport === 'tablet') return 130
  return 55
}

watch(() => props.open, (v) => {
  if (!v) {
    reset()
  } else {
    if (props.openToUrl && URL_CAPTURE_ENABLED) type.value = 'url'
    nextTick(() => nameInputRef.value?.focus())
  }
})

function resetCaptureState() {
  for (const viewport of (['desktop', 'tablet', 'mobile'] as const)) {
    captureState[viewport].status = 'idle'
    captureState[viewport].src = ''
  }
}

function reset() {
  step.value = 'main'
  type.value = 'blank'
  name.value = ''
  url.value = ''
  prevHostname.value = ''
  nameFocused.value = false
  preset.value = 'laptop+phone'
  resetCaptureState()
  captureError.value = ''
  captureAbortController?.abort()
  captureAbortController = null
  captureCancelled = false
  stopElapsed()
}

function onCancelCapture() {
  captureCancelled = true
  captureAbortController?.abort()
  captureAbortController = null
  stopElapsed()
  step.value = 'preset'
  captureError.value = ''
  resetCaptureState()
}

function onClose() {
  emit('close')
}

function onExpandEnter(el: Element) {
  const e = el as HTMLElement
  const height = e.scrollHeight
  e.style.height = '0px'
  requestAnimationFrame(() => {
    e.style.height = `${height}px`
  })
}

function onExpandAfterEnter(el: Element) {
  (el as HTMLElement).style.height = ''
}

function onExpandLeave(el: Element) {
  const e = el as HTMLElement
  e.style.height = `${e.scrollHeight}px`
  requestAnimationFrame(() => {
    e.style.height = '0px'
  })
}

function onSubmitMain() {
  if (!canSubmit.value) return
  if (type.value === 'url') step.value = 'preset'
  else onCreateBlank()
}

function onUrlInput() {
  try {
    const parsed = new URL(resolvedUrl.value)
    const h = parsed.hostname
    if (!nameFocused.value && (!name.value || name.value === prevHostname.value)) {
      name.value = h
    }
    prevHostname.value = h
  } catch {}
}

async function onCreateBlank() {
  if (!name.value.trim()) return
  const project = await createProjectFn(name.value.trim())
  emit('created', project.id)
}

async function captureOne(viewport: CaptureViewport): Promise<{ img: HTMLImageElement; src: string } | null> {
  captureState[viewport].status = 'loading'
  try {
    const res = await fetch('/api/screenshot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authStore.token}` },
      body: JSON.stringify({ url: resolvedUrl.value, viewport }),
      signal: captureAbortController?.signal,
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
    captureState[viewport].status = 'done'
    captureState[viewport].src = src
    return { img, src }
  } catch {
    captureState[viewport].status = 'error'
    return null
  }
}

/** Registers a captured screenshot as a source image and creates a matching snip cropped to that viewport's frame aspect. */
function addCapturedSource(
  projectId: string,
  viewport: CaptureViewport,
  capture: { img: HTMLImageElement; src: string },
  sortOrder: number,
): { snipId: string; width: number; height: number } {
  const sourceId = crypto.randomUUID()
  const source: SourceImage = {
    id: sourceId,
    projectId,
    label: `${displayHostname.value} ${viewport}`,
    filename: `${displayHostname.value}-${viewport}.png`,
    width: capture.img.naturalWidth,
    height: capture.img.naturalHeight,
    sortOrder,
  }
  sourcesStore.addSource(source)
  sourcesStore.setLoadedImage(sourceId, capture.img, capture.src)
  sourcesStore.setActiveSource(sourceId)
  saveImage(projectId, sourceId, capture.src)
  const width = capture.img.naturalWidth
  const height = Math.min(capture.img.naturalHeight, Math.round(width / VIEWPORT_SCREEN_ASPECT[viewport]))
  const snip = createSnip(0, 0, width, height, VIEWPORT_SNAP_FRAME[viewport], sourceId)
  return { snipId: snip.id, width, height }
}

async function onStartCapture() {
  if (!resolvedUrl.value || urlError.value || !name.value.trim()) return
  step.value = 'capturing'
  captureError.value = ''
  resetCaptureState()
  captureCancelled = false
  captureAbortController = new AbortController()
  startElapsed()

  const viewports = activeViewports.value
  const captured = new Map<CaptureViewport, { img: HTMLImageElement; src: string }>()

  // The screenshot service caps concurrent captures at 2 (MAX_CONCURRENT_CAPTURES),
  // so run in batches rather than firing all viewports at once.
  for (let i = 0; i < viewports.length; i += MAX_CONCURRENT_CAPTURES) {
    const batch = viewports.slice(i, i + MAX_CONCURRENT_CAPTURES)
    const batchResults = await Promise.all(batch.map((v) => captureOne(v)))
    if (captureCancelled) break
    batch.forEach((v, j) => {
      const result = batchResults[j]
      if (result) captured.set(v, result)
    })
  }

  stopElapsed()

  if (captureCancelled) return

  if (captured.size === 0) {
    captureError.value = viewports.length > 1
      ? 'All captures failed. Check the URL and try again.'
      : 'Capture failed. Check the URL and try again.'
    return
  }

  try {
    const project = await createProjectFn(name.value.trim())

    // Initialize stores for the new empty project
    projectStore.setProject(project)
    sourcesStore.setSources([])
    snipsStore.setSnips([])
    compositionsStore.setCompositions([])

    const placed = new Map<CaptureViewport, { snipId: string; width: number; height: number }>()
    let sortOrder = 0
    for (const viewport of viewports) {
      const capture = captured.get(viewport)
      if (!capture) continue
      placed.set(viewport, addCapturedSource(project.id, viewport, capture, sortOrder++))
    }

    const desktop = placed.get('desktop')
    const tablet = placed.get('tablet')
    const mobile = placed.get('mobile')

    let comp
    if (preset.value === 'laptop+tablet+phone' && desktop && tablet && mobile) {
      comp = createLaptopTabletPhoneComposition(desktop.snipId, tablet.snipId, mobile.snipId, displayHostname.value)
    } else if ((preset.value === 'browser' || preset.value === 'browser+url') && desktop) {
      const browserUrl = preset.value === 'browser+url' ? resolvedUrl.value.replace(/^https?:\/\//, '') : undefined
      comp = createBrowserComposition(desktop.snipId, desktop.width, desktop.height, displayHostname.value, undefined, browserUrl)
    } else if (desktop && mobile) {
      comp = createLaptopPhoneComposition(desktop.snipId, mobile.snipId, displayHostname.value)
    } else {
      const fallback = desktop ?? tablet ?? mobile
      comp = createLaptopComposition(fallback!.snipId, displayHostname.value)
    }

    await persistAll()
    emit('composed', project.id, comp.id)
  } catch {
    captureError.value = 'Failed to create project. Please try again.'
  }
}
</script>

<style scoped>
.expand-panel {
  overflow: hidden;
  margin-top: 0 !important;
}
.expand-enter-active,
.expand-leave-active {
  transition: height 0.125s linear, opacity 0.125s linear;
}
.expand-enter-from,
.expand-leave-to {
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.1s linear;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
