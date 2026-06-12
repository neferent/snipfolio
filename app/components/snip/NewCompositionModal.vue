<template>
  <AppModal :open="open" title="New Composition" max-width="760px" @close="$emit('close')">
    <div class="flex gap-5">
      <!-- Left: form controls -->
      <div class="w-64 shrink-0 space-y-4">
        <div class="space-y-1.5">
          <label for="new-composition-name" class="text-xs font-medium text-[var(--color-text-muted)]">Name</label>
          <input
            id="new-composition-name"
            v-model="name"
            class="w-full"
            placeholder="My composition"
          />
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-medium text-[var(--color-text-muted)]">Background</label>
          <AppColorPicker v-model="backgroundColor" />
        </div>

        <!-- Type picker -->
        <div class="space-y-2">
          <label class="text-xs font-medium text-[var(--color-text-muted)]">Type</label>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="t in types"
              :key="t.value"
              class="p-3 text-left transition"
              :class="t.span ? 'col-span-2' : ''"
              :style="type === t.value
                ? 'border-radius:8px;border:1.5px solid #8e9ead;background:rgba(142,158,173,0.08)'
                : 'border-radius:8px;border:0.5px solid rgba(255,255,255,0.06);background:#1e2228'"
              @click="type = t.value"
            >
              <component :is="t.icon" class="size-5 text-[var(--color-text-muted)]" />
              <div class="mt-2 flex items-center gap-1.5 text-sm font-medium text-[var(--color-text)]">
                {{ t.label }}
                <span v-if="t.value === 'url' && !isPro" class="rounded px-1.5 py-0.5 text-[10px] font-semibold bg-[var(--color-accent)]/20 text-[var(--color-accent)]">Pro</span>
              </div>
              <div class="mt-[2px] text-[12px] leading-tight text-[var(--color-text-muted)]">{{ t.hint }}</div>
            </button>
          </div>
        </div>

        <!-- Snip selector — adapts per type -->
        <div class="space-y-2">
          <!-- Laptop: single radio -->
          <template v-if="type === 'laptop'">
            <label class="text-xs font-medium text-[var(--color-text-muted)]">Desktop snip</label>
            <div class="max-h-40 overflow-y-auto space-y-1 rounded-lg border border-[var(--color-border)] p-1">
              <label
                v-for="snip in laptopSnips"
                :key="snip.id"
                class="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition hover:bg-white/5"
              >
                <input type="radio" :value="snip.id" v-model="laptopSnipId" class="accent-[var(--color-accent)]" />
                <SnipThumbnail :snip="snip" class="size-7 rounded" />
                <span class="flex-1 truncate text-[var(--color-text)]">{{ snip.label }}</span>
              </label>
              <p v-if="laptopSnips.length === 0" class="px-2 py-2 text-xs text-[var(--color-text-muted)]">No desktop snips yet</p>
            </div>
          </template>

          <!-- Laptop + Phone: two separate pickers -->
          <template v-else-if="type === 'laptop+phone'">
            <label class="text-xs font-medium text-[var(--color-text-muted)]">Desktop snip</label>
            <div class="max-h-32 overflow-y-auto space-y-1 rounded-lg border border-[var(--color-border)] p-1">
              <label
                v-for="snip in laptopSnips"
                :key="snip.id"
                class="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition hover:bg-white/5"
              >
                <input type="radio" :value="snip.id" v-model="laptopSnipId" class="accent-[var(--color-accent)]" />
                <SnipThumbnail :snip="snip" class="size-7 rounded" />
                <span class="flex-1 truncate text-[var(--color-text)]">{{ snip.label }}</span>
              </label>
              <p v-if="laptopSnips.length === 0" class="px-2 py-2 text-xs text-[var(--color-text-muted)]">No desktop snips yet</p>
            </div>
            <label class="text-xs font-medium text-[var(--color-text-muted)]">Mobile snip</label>
            <div class="max-h-32 overflow-y-auto space-y-1 rounded-lg border border-[var(--color-border)] p-1">
              <label
                v-for="snip in phoneSnips"
                :key="snip.id"
                class="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition hover:bg-white/5"
              >
                <input type="radio" :value="snip.id" v-model="phoneSnipId" class="accent-[var(--color-accent)]" />
                <SnipThumbnail :snip="snip" class="size-7 rounded" />
                <span class="flex-1 truncate text-[var(--color-text)]">{{ snip.label }}</span>
              </label>
              <p v-if="phoneSnips.length === 0" class="px-2 py-2 text-xs text-[var(--color-text-muted)]">No mobile snips yet</p>
            </div>
          </template>

          <!-- Auto: 2+ checkboxes -->
          <template v-else-if="type === 'auto'">
            <label class="text-xs font-medium text-[var(--color-text-muted)]">
              Snips <span v-if="selectedIds.length > 0" class="text-[var(--color-accent)]">({{ selectedIds.length }})</span>
            </label>
            <div class="max-h-48 overflow-y-auto space-y-1 rounded-lg border border-[var(--color-border)] p-1">
              <label
                v-for="snip in snips"
                :key="snip.id"
                class="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition hover:bg-white/5"
              >
                <input type="checkbox" :value="snip.id" v-model="selectedIds" class="accent-[var(--color-accent)]" />
                <SnipThumbnail :snip="snip" class="size-7 rounded" />
                <span class="flex-1 truncate text-[var(--color-text)]">{{ snip.label }}</span>
              </label>
              <p v-if="snips.length === 0" class="px-2 py-2 text-xs text-[var(--color-text-muted)]">No snips yet</p>
            </div>
          </template>

          <!-- From URL: Pro upsell -->
          <template v-else-if="type === 'url' && !isPro">
            <p class="text-sm text-[var(--color-text-muted)]">
              Capturing from a live URL is a Pro feature.
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
          </template>

          <!-- From URL: capture desktop/mobile screenshots and create snips -->
          <template v-else-if="type === 'url'">
            <label for="new-composition-url" class="text-xs font-medium text-[var(--color-text-muted)]">URL</label>
            <input
              id="new-composition-url"
              v-model="url"
              type="text"
              inputmode="url"
              class="w-full"
              :class="urlError ? 'border-red-400/40' : ''"
              placeholder="https://example.com"
              :disabled="isCapturing"
              @keydown.enter="create"
            />
            <p v-if="urlError" class="-mt-1 text-[10px] text-red-400">{{ urlError }}</p>
            <div class="flex items-center gap-4 pt-1">
              <label
                v-for="v in urlViewports"
                :key="v.key"
                class="flex cursor-pointer items-center gap-1.5 text-xs text-[var(--color-text-muted)] select-none"
              >
                <input
                  v-model="selectedViewports"
                  type="checkbox"
                  :value="v.key"
                  :disabled="isCapturing"
                  class="accent-[var(--color-accent)]"
                />
                {{ v.label }}
              </label>
            </div>
            <p v-if="captureError" class="text-xs text-red-400">{{ captureError }}</p>
          </template>

          <!-- Freeform: optional checkboxes (can add more later in editor) -->
          <template v-else>
            <label class="text-xs font-medium text-[var(--color-text-muted)]">
              Initial snips <span class="text-[var(--color-text-muted)] font-normal">(optional)</span>
            </label>
            <div class="max-h-48 overflow-y-auto space-y-1 rounded-lg border border-[var(--color-border)] p-1">
              <label
                v-for="snip in snips"
                :key="snip.id"
                class="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition hover:bg-white/5"
              >
                <input type="checkbox" :value="snip.id" v-model="selectedIds" class="accent-[var(--color-accent)]" />
                <SnipThumbnail :snip="snip" class="size-7 rounded" />
                <span class="flex-1 truncate text-[var(--color-text)]">{{ snip.label }}</span>
              </label>
              <p v-if="snips.length === 0" class="px-2 py-2 text-xs text-[var(--color-text-muted)]">No snips yet</p>
            </div>
          </template>
        </div>
      </div>

      <!-- Right: live preview -->
      <div class="flex min-w-0 flex-1 flex-col gap-1.5">
        <label class="text-xs font-medium text-[var(--color-text-muted)]">Preview</label>
        <div class="flex-1 min-h-[260px] overflow-hidden rounded-lg border border-[var(--color-border)]">
          <CompositionCanvas v-if="previewComposition" :composition="previewComposition" />
          <div
            v-else-if="type === 'url' && (isCapturing || desktopStatus !== 'idle' || mobileStatus !== 'idle')"
            class="flex h-full flex-col items-center justify-center gap-3 p-4"
          >
            <p class="text-xs text-[var(--color-text-muted)]">
              {{ captureError ? 'Capture failed' : `Capturing ${displayHostname}…` }}
            </p>
            <p v-if="!captureError" class="-mt-2 text-[10px] text-[var(--color-text-muted)]/70">
              {{ captureProgressHint(elapsedSeconds) }}
            </p>
            <div class="flex items-end gap-2">
              <div
                v-if="selectedViewports.includes('desktop')"
                class="flex flex-col overflow-hidden rounded border border-white/10"
                style="width: 160px;"
              >
                <div class="relative flex items-center justify-center bg-black/20" style="height: 72px;">
                  <Loader2Icon v-if="desktopStatus === 'loading'" class="size-4 animate-spin text-white/30" />
                  <img
                    v-else-if="desktopStatus === 'done' && desktopSrc"
                    :src="desktopSrc"
                    class="absolute inset-0 block w-full object-cover object-top"
                    draggable="false"
                  />
                  <XIcon v-else-if="desktopStatus === 'error'" class="size-4 text-red-400" />
                </div>
                <div class="flex items-center gap-1 border-t border-white/10 px-1.5 py-1">
                  <CheckIcon v-if="desktopStatus === 'done'" class="size-3 shrink-0 text-emerald-400" />
                  <Loader2Icon v-else-if="desktopStatus === 'loading'" class="size-3 shrink-0 animate-spin text-white/30" />
                  <XIcon v-else-if="desktopStatus === 'error'" class="size-3 shrink-0 text-red-400" />
                  <span class="truncate text-[10px] text-[var(--color-text-muted)]">Desktop</span>
                </div>
              </div>
              <div
                v-if="selectedViewports.includes('mobile')"
                class="flex flex-col overflow-hidden rounded border border-white/10"
                style="width: 43px;"
              >
                <div class="relative flex items-center justify-center bg-black/20" style="height: 72px;">
                  <Loader2Icon v-if="mobileStatus === 'loading'" class="size-4 animate-spin text-white/30" />
                  <img
                    v-else-if="mobileStatus === 'done' && mobileSrc"
                    :src="mobileSrc"
                    class="absolute inset-0 block w-full object-cover object-top"
                    draggable="false"
                  />
                  <XIcon v-else-if="mobileStatus === 'error'" class="size-4 text-red-400" />
                </div>
                <div class="flex items-center gap-1 border-t border-white/10 px-1.5 py-1">
                  <CheckIcon v-if="mobileStatus === 'done'" class="size-3 shrink-0 text-emerald-400" />
                  <Loader2Icon v-else-if="mobileStatus === 'loading'" class="size-3 shrink-0 animate-spin text-white/30" />
                  <XIcon v-else-if="mobileStatus === 'error'" class="size-3 shrink-0 text-red-400" />
                  <span class="truncate text-[10px] text-[var(--color-text-muted)]">Mobile</span>
                </div>
              </div>
            </div>
            <p v-if="captureError" class="text-xs text-red-400">{{ captureError }}</p>
          </div>
          <div v-else class="flex h-full items-center justify-center text-xs text-[var(--color-text-muted)]">
            {{ previewHint }}
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <button
        class="flex h-8 items-center rounded-[6px] px-3 text-sm text-[var(--color-text-muted)] transition hover:bg-white/10"
        @click="$emit('close')"
      >
        Cancel
      </button>
      <button
        class="flex h-8 items-center rounded-[6px] bg-[var(--color-accent)] px-4 text-sm font-medium transition hover:bg-[var(--color-accent-hover)] hover:text-[var(--color-text)] disabled:opacity-50 text-[var(--color-on-accent)]"
        :disabled="!canCreate"
        @click="create"
      >
        {{ createLabel }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { Laptop, MonitorSmartphone, LayoutGrid, Layers, Globe, Loader2Icon, CheckIcon, XIcon } from 'lucide-vue-next'
import { resolveCaptureUrl, getCaptureHostname, isValidCaptureUrl, useCaptureElapsed, captureProgressHint } from '~/composables/useUrlCapture'
import { useSnipsStore } from '~/stores/snips'
import { useProjectStore } from '~/stores/project'
import { useSourcesStore } from '~/stores/sources'
import { useSnips } from '~/composables/useSnips'
import { useProject } from '~/composables/useProject'
import { useCompositions, getLaptopLayout, getLaptopPhoneLayout, getFreeformGridLayout } from '~/composables/useCompositions'
import { useAuthStore } from '~/stores/auth'
import { usePlan } from '~/composables/usePlan'
import { useCheckout } from '~/composables/useCheckout'
import type { Composition, FreeformCompositionConfig, CollageCompositionConfig, SourceImage } from '~/types'

// Screen area aspect ratios (width/height) matching the SVG frame definitions
const LAPTOP_SCREEN_ASPECT = 3034.7 / 1964.07  // ≈ 1.545
const PHONE_SCREEN_ASPECT  = 709.65 / 1539.77  // ≈ 0.461

type CaptureStatus = 'idle' | 'loading' | 'done' | 'error'
type Viewport = 'desktop' | 'mobile'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const snipsStore = useSnipsStore()
const projectStore = useProjectStore()
const sourcesStore = useSourcesStore()
const { createSnip } = useSnips()
const { saveImage, scheduleSave } = useProject()
const { createLaptopComposition, createLaptopPhoneComposition, createAutoComposition, createFreeformComposition } = useCompositions()
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { isPro } = usePlan()
const { startCheckout, loading: checkoutLoading } = useCheckout()

const name = ref('')
const type = ref<'laptop' | 'laptop+phone' | 'auto' | 'freeform' | 'url'>('laptop')
const laptopSnipId = ref<string>('')
const phoneSnipId = ref<string>('')
const selectedIds = ref<string[]>([])
const backgroundColor = ref('#1a1a2e')
const snips = computed(() => snipsStore.orderedSnips)
const laptopSnips = computed(() => snipsStore.orderedSnips.filter((s) => s.snapFrame === 'laptop'))
const phoneSnips = computed(() => snipsStore.orderedSnips.filter((s) => s.snapFrame === 'phone'))

const url = ref('')
const selectedViewports = ref<Viewport[]>(['desktop', 'mobile'])
const desktopStatus = ref<CaptureStatus>('idle')
const mobileStatus = ref<CaptureStatus>('idle')
const desktopSrc = ref('')
const mobileSrc = ref('')
const captureError = ref('')
const isCapturing = ref(false)
const { elapsedSeconds, start: startElapsed, stop: stopElapsed } = useCaptureElapsed()

const urlViewports: { key: Viewport; label: string }[] = [
  { key: 'desktop', label: 'Desktop' },
  { key: 'mobile', label: 'Mobile' },
]

const types = [
  { value: 'laptop' as const, icon: Laptop, label: 'Desktop', hint: 'One snip in a desktop frame' },
  { value: 'laptop+phone' as const, icon: MonitorSmartphone, label: 'Desktop + Mobile', hint: 'Two snips side by side' },
  { value: 'auto' as const, icon: LayoutGrid, label: 'Auto-Collage', hint: 'Auto-arranged grid, no device frames' },
  { value: 'freeform' as const, icon: Layers, label: 'Free-form', hint: 'Place and frame freely' },
  { value: 'url' as const, icon: Globe, label: 'From URL', hint: 'Capture desktop & mobile, compose instantly', span: true },
]

const resolvedUrl = computed(() => resolveCaptureUrl(url.value))
const displayHostname = computed(() => getCaptureHostname(url.value))
const urlError = computed(() => {
  if (!url.value || isValidCaptureUrl(url.value)) return ''
  return 'Enter a valid URL'
})

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      const projectName = projectStore.current?.name ?? 'Project'
      name.value = `${projectName} - Composition ${snips.value.length + 1}`
      backgroundColor.value = '#1a1a2e'
      type.value = 'laptop'
      laptopSnipId.value = ''
      phoneSnipId.value = ''
      selectedIds.value = []
      url.value = ''
      selectedViewports.value = ['desktop', 'mobile']
      desktopStatus.value = 'idle'
      mobileStatus.value = 'idle'
      desktopSrc.value = ''
      mobileSrc.value = ''
      captureError.value = ''
      isCapturing.value = false
      stopElapsed()
    }
  },
)

const bg = computed(() => ({
  type: 'solid' as const,
  color: backgroundColor.value,
  gradientStart: backgroundColor.value,
  gradientEnd: '#16213e',
  gradientAngle: 135,
}))

const previewHint = computed(() => {
  if (type.value === 'laptop') return 'Select a desktop snip to preview'
  if (type.value === 'laptop+phone') return 'Select both snips to preview'
  if (type.value === 'auto') return 'Select 2+ snips to preview'
  if (type.value === 'url') return 'Enter a URL to capture and compose'
  return 'Select snips to preview (optional)'
})

const previewComposition = computed<Composition | null>(() => {
  const projectId = projectStore.current?.id ?? ''
  const outputWidth = 1920
  const outputHeight = 1080

  if (type.value === 'laptop') {
    if (!laptopSnipId.value) return null
    const config: FreeformCompositionConfig = {
      slots: [{
        id: '__preview_slot__',
        snipId: laptopSnipId.value,
        deviceFrame: 'laptop',
        ...getLaptopLayout(outputWidth, outputHeight),
      }],
      background: bg.value,
      outputWidth,
      outputHeight,
    }
    return { id: '__preview__', projectId, name: 'Preview', type: 'laptop', sortOrder: 0, config }
  }

  if (type.value === 'laptop+phone') {
    if (!laptopSnipId.value || !phoneSnipId.value) return null
    const layout = getLaptopPhoneLayout(outputWidth, outputHeight)
    const config: FreeformCompositionConfig = {
      slots: [
        {
          id: '__preview_slot_laptop__',
          snipId: laptopSnipId.value,
          deviceFrame: 'laptop',
          ...layout.laptop,
        },
        {
          id: '__preview_slot_phone__',
          snipId: phoneSnipId.value,
          deviceFrame: 'phone',
          ...layout.phone,
        },
      ],
      background: bg.value,
      outputWidth,
      outputHeight,
    }
    return { id: '__preview__', projectId, name: 'Preview', type: 'laptop+phone', sortOrder: 0, config }
  }

  if (type.value === 'auto') {
    if (selectedIds.value.length < 2) return null
    const config: CollageCompositionConfig = {
      slots: selectedIds.value.map((snipId) => ({ snipId })),
      template: 'auto',
      gap: 24,
      background: bg.value,
      outputWidth,
      outputHeight,
    }
    return { id: '__preview__', projectId, name: 'Preview', type: 'auto', sortOrder: 0, config }
  }

  // freeform — preview if any snips selected
  if (selectedIds.value.length === 0) return null
  const layout = getFreeformGridLayout(
    selectedIds.value.map((snipId) => {
      const snip = snipsStore.snips.find((s) => s.id === snipId)
      return { width: snip?.width ?? 800, height: snip?.height ?? 600 }
    }),
    outputWidth,
    outputHeight,
  )
  const slots = selectedIds.value.map((snipId, i) => ({
    id: `__preview_slot_${i}__`,
    snipId,
    deviceFrame: 'none' as const,
    ...layout[i]!,
  }))
  const config: FreeformCompositionConfig = {
    slots,
    background: bg.value,
    outputWidth,
    outputHeight,
  }
  return { id: '__preview__', projectId, name: 'Preview', type: 'freeform', sortOrder: 0, config }
})

const canCreate = computed(() => {
  if (type.value === 'laptop') return !!laptopSnipId.value
  if (type.value === 'laptop+phone') return !!laptopSnipId.value && !!phoneSnipId.value
  if (type.value === 'auto') return selectedIds.value.length >= 2
  if (type.value === 'url') return isPro.value && !!resolvedUrl.value && !urlError.value && selectedViewports.value.length > 0 && !isCapturing.value
  return true // freeform: always valid
})

const createLabel = computed(() => {
  if (type.value === 'url') {
    if (isCapturing.value) return 'Capturing…'
    if (captureError.value) return 'Retry'
    return 'Capture & Create'
  }
  return 'Create'
})

async function captureViewport(viewport: Viewport): Promise<{ img: HTMLImageElement; src: string } | null> {
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
    if (viewport === 'desktop') { desktopStatus.value = 'done'; desktopSrc.value = src }
    else { mobileStatus.value = 'done'; mobileSrc.value = src }
    return { img, src }
  } catch {
    if (viewport === 'desktop') desktopStatus.value = 'error'
    else mobileStatus.value = 'error'
    return null
  }
}

async function createFromUrl() {
  if (!projectStore.current) return
  isCapturing.value = true
  captureError.value = ''
  desktopStatus.value = selectedViewports.value.includes('desktop') ? 'loading' : 'idle'
  mobileStatus.value = selectedViewports.value.includes('mobile') ? 'loading' : 'idle'
  desktopSrc.value = ''
  mobileSrc.value = ''
  startElapsed()

  const [desktop, mobile] = await Promise.all([
    selectedViewports.value.includes('desktop') ? captureViewport('desktop') : Promise.resolve(null),
    selectedViewports.value.includes('mobile') ? captureViewport('mobile') : Promise.resolve(null),
  ])

  stopElapsed()

  if (!desktop && !mobile) {
    captureError.value = 'Capture failed. Check the URL and try again.'
    isCapturing.value = false
    return
  }

  const projectId = projectStore.current.id
  let desktopSnipId: string | null = null
  let mobileSnipId: string | null = null

  if (desktop) {
    const sourceId = crypto.randomUUID()
    const source: SourceImage = {
      id: sourceId,
      projectId,
      label: `${displayHostname.value} desktop`,
      filename: `${displayHostname.value}-desktop.png`,
      width: desktop.img.naturalWidth,
      height: desktop.img.naturalHeight,
      sortOrder: sourcesStore.sources.length,
    }
    sourcesStore.addSource(source)
    sourcesStore.setLoadedImage(sourceId, desktop.img, desktop.src)
    sourcesStore.setActiveSource(sourceId)
    saveImage(projectId, sourceId, desktop.src)
    const snipH = Math.min(desktop.img.naturalHeight, Math.round(desktop.img.naturalWidth / LAPTOP_SCREEN_ASPECT))
    const snip = createSnip(0, 0, desktop.img.naturalWidth, snipH, 'laptop', sourceId)
    desktopSnipId = snip.id
  }

  if (mobile) {
    const sourceId = crypto.randomUUID()
    const source: SourceImage = {
      id: sourceId,
      projectId,
      label: `${displayHostname.value} mobile`,
      filename: `${displayHostname.value}-mobile.png`,
      width: mobile.img.naturalWidth,
      height: mobile.img.naturalHeight,
      sortOrder: sourcesStore.sources.length,
    }
    sourcesStore.addSource(source)
    sourcesStore.setLoadedImage(sourceId, mobile.img, mobile.src)
    if (!desktop) sourcesStore.setActiveSource(sourceId)
    saveImage(projectId, sourceId, mobile.src)
    const snipH = Math.min(mobile.img.naturalHeight, Math.round(mobile.img.naturalWidth / PHONE_SCREEN_ASPECT))
    const snip = createSnip(0, 0, mobile.img.naturalWidth, snipH, 'phone', sourceId)
    mobileSnipId = snip.id
  }

  const compName = name.value || displayHostname.value
  const comp = desktopSnipId && mobileSnipId
    ? createLaptopPhoneComposition(desktopSnipId, mobileSnipId, compName, bg.value)
    : createLaptopComposition((desktopSnipId ?? mobileSnipId)!, compName, bg.value)

  scheduleSave()
  isCapturing.value = false
  emit('close')
  router.push(`/project/${route.params.id}/compose/${comp.id}`)
}

async function create() {
  if (!canCreate.value) return
  if (type.value === 'url') {
    await createFromUrl()
    return
  }
  const bgVal = bg.value
  let comp
  if (type.value === 'laptop') {
    comp = createLaptopComposition(laptopSnipId.value, name.value || undefined, bgVal)
  } else if (type.value === 'laptop+phone') {
    comp = createLaptopPhoneComposition(laptopSnipId.value, phoneSnipId.value, name.value || undefined, bgVal)
  } else if (type.value === 'auto') {
    comp = createAutoComposition(selectedIds.value, name.value || undefined, bgVal)
  } else {
    comp = createFreeformComposition(selectedIds.value, name.value || undefined, bgVal)
  }
  emit('close')
  router.push(`/project/${route.params.id}/compose/${comp.id}`)
}
</script>
