<template>
  <AppModal :open="open" :title="modalTitle" max-width="760px" @close="$emit('close')">
    <div v-if="step === 'main'" class="flex gap-5">
      <!-- Left: form controls -->
      <div class="w-64 shrink-0 space-y-4">
        <div class="space-y-1.5">
          <label for="new-composition-name" class="text-xs font-medium text-[var(--color-text-muted)]">Name</label>
          <AppInput
            id="new-composition-name"
            v-model="name"
            placeholder="My mockup"
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
                ? 'border-radius:8px;border:1.5px solid var(--color-accent);background:rgba(142,158,173,0.08)'
                : 'border-radius:8px;border:0.5px solid var(--color-border);background:var(--color-surface-3)'"
              @click="type = t.value"
            >
              <component :is="t.icon" class="size-5 text-[var(--color-text-muted)]" />
              <div class="mt-2 flex items-center gap-1.5 text-sm font-medium text-[var(--color-text)]">
                {{ t.label }}
                <span v-if="t.value === 'url' && !isPro" class="rounded px-1.5 py-0.5 text-[10px] font-semibold bg-[var(--color-accent)]/20 text-[var(--color-accent)]">3-Day Pass</span>
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
                class="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition hover:bg-overlay/5"
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
                class="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition hover:bg-overlay/5"
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
                class="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition hover:bg-overlay/5"
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
                class="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition hover:bg-overlay/5"
              >
                <input type="checkbox" :value="snip.id" v-model="selectedIds" class="accent-[var(--color-accent)]" />
                <SnipThumbnail :snip="snip" class="size-7 rounded" />
                <span class="flex-1 truncate text-[var(--color-text)]">{{ snip.label }}</span>
              </label>
              <p v-if="snips.length === 0" class="px-2 py-2 text-xs text-[var(--color-text-muted)]">No snips yet</p>
            </div>
          </template>

          <!-- From URL: 3-Day Pass upsell -->
          <template v-else-if="type === 'url' && !isPro">
            <p class="text-sm text-[var(--color-text-muted)]">
              Capturing from a live URL requires a 3-Day Access Pass.
            </p>
            <div class="rounded-lg px-3 py-2.5 bg-[var(--color-surface-3)] [border:0.5px_solid_rgba(142,158,173,0.2)]">
              <AppButton size="sm" class="w-full" :disabled="checkoutLoading" @click="startCheckout('day_pass', checkoutReturnUrl('openNewComposition=1'))">
                <Loader2Icon v-if="checkoutLoading" class="size-3 shrink-0 animate-spin" />
                {{ checkoutLoading ? 'Redirecting to Lemon Squeezy…' : 'Get 3-Day Pass — $4.99' }}
              </AppButton>
            </div>
          </template>

          <!-- From URL: capture from a live page -->
          <template v-else-if="type === 'url'">
            <label for="new-composition-url" class="text-xs font-medium text-[var(--color-text-muted)]">URL</label>
            <AppInput
              id="new-composition-url"
              v-model="url"
              type="text"
              inputmode="url"
              :error="!!urlError"
              placeholder="https://example.com"
              @keydown.enter="onUrlNext"
            />
            <p v-if="urlError" class="-mt-1 text-[10px] text-red-400">{{ urlError }}</p>
            <p class="text-xs text-[var(--color-text-muted)]">Choose what to capture on the next step</p>
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
                class="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition hover:bg-overlay/5"
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
          <div v-else class="flex h-full items-center justify-center text-xs text-[var(--color-text-muted)]">
            {{ previewHint }}
          </div>
        </div>
      </div>
    </div>

    <!-- Step 2: Preset selection (From URL only) -->
    <CapturePresetStep v-else-if="step === 'preset'" v-model="preset" :hostname="displayHostname" />

    <!-- Step 3: Capturing (From URL only) -->
    <CapturingStep
      v-else-if="step === 'capturing'"
      :active-viewports="activeViewports"
      :capture-state="captureState"
      :capture-error="captureError"
      :tick-now="tickNow"
      @cancel="onCancelCapture"
    />

    <template #footer>
      <template v-if="step === 'main'">
        <AppButton variant="ghost" @click="$emit('close')">
          Cancel
        </AppButton>
        <AppButton v-if="type === 'url'" :disabled="!canGoToPreset" @click="onUrlNext">
          Next
        </AppButton>
        <AppButton v-else :disabled="!canCreate" @click="create">
          Create
        </AppButton>
      </template>

      <!-- Step 2: preset selection -->
      <template v-else-if="step === 'preset'">
        <AppButton variant="ghost" @click="step = 'main'">
          Back
        </AppButton>
        <AppButton @click="onStartCapture">
          Capture &amp; Create
        </AppButton>
      </template>

      <!-- Step 3: capturing — only show buttons on error -->
      <template v-else-if="step === 'capturing' && captureError">
        <AppButton variant="ghost" @click="step = 'main'">
          Back
        </AppButton>
        <AppButton @click="onStartCapture">
          Retry
        </AppButton>
      </template>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { Laptop, MonitorSmartphone, LayoutGrid, Layers, Globe, Loader2Icon } from 'lucide-vue-next'
import { resolveCaptureUrl, getCaptureHostname, isValidCaptureUrl } from '~/composables/useUrlCapture'
import type { CaptureViewport } from '~/composables/useUrlCapture'
import { useUrlCaptureFlow } from '~/composables/useUrlCaptureFlow'
import type { PlacedSnip } from '~/composables/useUrlCaptureFlow'
import { useSnipsStore } from '~/stores/snips'
import { useProjectStore } from '~/stores/project'
import { useSourcesStore } from '~/stores/sources'
import { useProject } from '~/composables/useProject'
import { useCompositions, getLaptopLayout, getLaptopPhoneLayout, getFreeformGridLayout } from '~/composables/useCompositions'
import { usePlan } from '~/composables/usePlan'
import { useCheckout, checkoutReturnUrl } from '~/composables/useCheckout'
import type { Composition, FreeformCompositionConfig, CollageCompositionConfig } from '~/types'

type Step = 'main' | 'preset' | 'capturing'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const snipsStore = useSnipsStore()
const projectStore = useProjectStore()
const sourcesStore = useSourcesStore()
const { scheduleSave } = useProject()
const { createLaptopComposition, createLaptopPhoneComposition, createAutoComposition, createFreeformComposition } = useCompositions()
const router = useRouter()
const route = useRoute()
const { isPro } = usePlan()
const { startCheckout, loading: checkoutLoading } = useCheckout()

const {
  preset,
  captureState,
  captureError,
  activeViewports,
  tickNow,
  reset: resetCaptureFlow,
  cancel: cancelCapture,
  runCapture,
  addCapturedSource,
  createCompositionFromPreset,
} = useUrlCaptureFlow()

const name = ref('')
const type = ref<'laptop' | 'laptop+phone' | 'auto' | 'freeform' | 'url'>('laptop')
const laptopSnipId = ref<string>('')
const phoneSnipId = ref<string>('')
const selectedIds = ref<string[]>([])
const backgroundColor = ref('#1a1a2e')
const snips = computed(() => snipsStore.orderedSnips)
const laptopSnips = computed(() => snipsStore.orderedSnips.filter((s) => s.snapFrame === 'laptop'))
const phoneSnips = computed(() => snipsStore.orderedSnips.filter((s) => s.snapFrame === 'phone'))

const step = ref<Step>('main')
const url = ref('')

const types = [
  { value: 'laptop' as const, icon: Laptop, label: 'Desktop', hint: 'One snip in a desktop frame' },
  { value: 'laptop+phone' as const, icon: MonitorSmartphone, label: 'Desktop + Mobile', hint: 'Two snips side by side' },
  { value: 'auto' as const, icon: LayoutGrid, label: 'Auto-Collage', hint: 'Auto-arranged grid, no device frames' },
  { value: 'freeform' as const, icon: Layers, label: 'Free-form', hint: 'Place and frame freely' },
  ...(URL_CAPTURE_ENABLED ? [{ value: 'url' as const, icon: Globe, label: 'From URL', hint: 'Capture desktop & mobile, compose instantly', span: true }] : []),
]

const resolvedUrl = computed(() => resolveCaptureUrl(url.value))
const displayHostname = computed(() => getCaptureHostname(url.value))
const urlError = computed(() => {
  if (!url.value || isValidCaptureUrl(url.value)) return ''
  return 'Enter a valid URL'
})

const canGoToPreset = computed(() => isPro.value && !!resolvedUrl.value && !urlError.value)

const modalTitle = computed(() => {
  if (step.value === 'capturing') return captureError.value ? 'Capture failed' : `Capturing ${displayHostname.value}…`
  if (step.value === 'preset') return 'Choose a layout'
  return 'New Mockup'
})

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      const projectName = projectStore.current?.name ?? 'Project'
      name.value = `${projectName} - Mockup ${snips.value.length + 1}`
      backgroundColor.value = '#1a1a2e'
      type.value = 'laptop'
      laptopSnipId.value = ''
      phoneSnipId.value = ''
      selectedIds.value = []
      url.value = ''
      step.value = 'main'
      resetCaptureFlow()
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
  return true // freeform: always valid
})

function onUrlNext() {
  if (!canGoToPreset.value) return
  step.value = 'preset'
}

function onCancelCapture() {
  cancelCapture()
  step.value = 'preset'
}

async function onStartCapture() {
  if (!resolvedUrl.value || urlError.value || !projectStore.current) return
  step.value = 'capturing'

  const captured = await runCapture(resolvedUrl.value)
  if (!captured || captureError.value) return

  const projectId = projectStore.current.id
  const placed = new Map<CaptureViewport, PlacedSnip>()
  const imageSaves: Promise<void>[] = []
  let sortOrder = sourcesStore.sources.length
  for (const viewport of activeViewports.value) {
    const capture = captured.get(viewport)
    if (!capture) continue
    const { placed: p, saved } = addCapturedSource(projectId, viewport, capture, sortOrder++, displayHostname.value)
    placed.set(viewport, p)
    imageSaves.push(saved)
  }

  const comp = createCompositionFromPreset(placed, displayHostname.value, resolvedUrl.value, name.value || displayHostname.value, bg.value)

  await Promise.all(imageSaves)
  scheduleSave()
  emit('close')
  router.push(`/advanced/${route.params.id}/compose/${comp.id}`)
}

async function create() {
  if (!canCreate.value) return
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
  router.push(`/advanced/${route.params.id}/compose/${comp.id}`)
}
</script>
