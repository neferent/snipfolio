<template>
  <AppModal :open="open" :title="modalTitle" @close="onClose">
    <!-- Main: name + project type -->
    <div v-if="step === 'main'" class="space-y-3">
      <div class="space-y-1.5">
        <label class="text-xs font-medium text-[var(--color-text-muted)]">Project name</label>
        <AppInput
          ref="nameInputRef"
          v-model="name"
          :placeholder="type === 'url' ? 'example.com' : 'My project'"
          @focus="nameFocused = true"
          @blur="nameFocused = false"
          @keydown.enter="onSubmitMain"
        />
      </div>

      <div class="grid gap-3" :class="URL_CAPTURE_ENABLED ? 'grid-cols-2' : 'grid-cols-1'">
        <button
          v-if="URL_CAPTURE_ENABLED"
          class="flex flex-col gap-2 rounded-lg border p-4 text-left transition hover:bg-overlay/5 active:bg-overlay/5"
          :class="[
            type === 'url' ? 'border-[#8e9ead]/60 bg-overlay/5' : 'border-overlay/10 hover:border-overlay/20',
            isMobile ? 'order-first' : 'order-last',
          ]"
          @click="type = 'url'"
        >
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium text-[var(--color-text)]">Capture &amp; Compose</span>
          </div>
          <span class="text-xs text-[var(--color-text-muted)]">Paste a URL and get a polished mockup in seconds.</span>
        </button>
        <button
          class="flex flex-col gap-2 rounded-lg border p-4 text-left transition hover:bg-overlay/5 active:bg-overlay/5"
          :class="type === 'blank' ? 'border-[#8e9ead]/60 bg-overlay/5' : 'border-overlay/10 hover:border-overlay/20'"
          @click="type = 'blank'"
        >
          <span class="text-sm font-medium text-[var(--color-text)]">Blank</span>
          <span class="text-xs text-[var(--color-text-muted)]">Start empty, add screenshots manually</span>
        </button>
      </div>

      <Transition name="expand" @enter="onExpandEnter" @after-enter="onExpandAfterEnter" @leave="onExpandLeave">
        <div v-if="type === 'url'" key="url-pro" class="expand-panel space-y-1.5">
          <label class="mt-3 block text-xs font-medium text-[var(--color-text-muted)]">URL</label>
          <AppInput
            v-model="url"
            type="text"
            inputmode="url"
            :error="!!urlError"
            placeholder="https://example.com"
            @input="onUrlInput"
            @keydown.enter="onSubmitMain"
          />
          <p v-if="urlError" class="text-[10px] text-red-400">{{ urlError }}</p>
          <p class="text-xs text-[var(--color-text-muted)]">Choose what to capture on the next step</p>
        </div>
      </Transition>
    </div>

    <!-- Step 2: Preset selection -->
    <CapturePresetStep v-else-if="step === 'preset'" v-model="preset" :hostname="displayHostname" />

    <!-- Step 3: Capturing -->
    <CapturingStep
      v-else-if="step === 'capturing'"
      :active-viewports="activeViewports"
      :capture-state="captureState"
      :capture-error="captureError"
      :tick-now="tickNow"
      @cancel="onCancelCapture"
    />

    <template #footer>
      <!-- Main step -->
      <template v-if="step === 'main'">
        <AppButton
          :disabled="!canSubmit || creating"
          @click="onSubmitMain"
        >
          <Loader2Icon v-if="creating" class="size-3 shrink-0 animate-spin" />
          {{ type === 'url' ? 'Next' : creating ? 'Creating…' : 'Create' }}
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
import { resolveCaptureUrl, getCaptureHostname, isValidCaptureUrl } from '~/composables/useUrlCapture'
import type { CaptureViewport } from '~/composables/useUrlCapture'
import { useUrlCaptureFlow } from '~/composables/useUrlCaptureFlow'
import type { PlacedSnip } from '~/composables/useUrlCaptureFlow'
import { useProject } from '~/composables/useProject'
import { useProjectStore } from '~/stores/project'
import { useSourcesStore } from '~/stores/sources'
import { useSnipsStore } from '~/stores/snips'
import { useCompositionsStore } from '~/stores/compositions'
import { Loader2Icon } from 'lucide-vue-next'

type Step = 'main' | 'preset' | 'capturing'
type ProjectType = 'blank' | 'url'

const props = defineProps<{ open: boolean; openToUrl?: boolean }>()
const emit = defineEmits<{
  close: []
  created: [projectId: string]
  composed: [projectId: string, compositionId: string]
}>()

const { createProject: createProjectFn, savePreview, persistAll } = useProject()
const projectStore = useProjectStore()
const sourcesStore = useSourcesStore()
const snipsStore = useSnipsStore()
const compositionsStore = useCompositionsStore()
const isMobile = useIsMobile()

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

const step = ref<Step>('main')
const type = ref<ProjectType>('blank')
const name = ref('')
const url = ref('')
const nameFocused = ref(false)
const prevHostname = ref('')
const creating = ref(false)

const nameInputRef = ref<{ focus: () => void } | null>(null)

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
  if (type.value === 'url') return !!resolvedUrl.value && !urlError.value
  return true
})

watch(() => props.open, (v) => {
  if (!v) {
    reset()
  } else {
    if (props.openToUrl && URL_CAPTURE_ENABLED) type.value = 'url'
    nextTick(() => nameInputRef.value?.focus())
  }
})

function reset() {
  step.value = 'main'
  type.value = 'blank'
  name.value = ''
  url.value = ''
  prevHostname.value = ''
  nameFocused.value = false
  creating.value = false
  resetCaptureFlow()
}

function onCancelCapture() {
  cancelCapture()
  step.value = 'preset'
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
  creating.value = true
  try {
    const project = await createProjectFn(name.value.trim())
    emit('created', project.id)
  } finally {
    creating.value = false
  }
}

async function onStartCapture() {
  if (!resolvedUrl.value || urlError.value || !name.value.trim()) return
  step.value = 'capturing'

  const captured = await runCapture(resolvedUrl.value)
  if (!captured || captureError.value) return

  try {
    const project = await createProjectFn(name.value.trim())

    // Initialize stores for the new empty project
    projectStore.setProject(project)
    sourcesStore.setSources([])
    snipsStore.setSnips([])
    compositionsStore.setCompositions([])

    const placed = new Map<CaptureViewport, PlacedSnip>()
    const imageSaves: Promise<void>[] = []
    let sortOrder = 0
    for (const viewport of activeViewports.value) {
      const capture = captured.get(viewport)
      if (!capture) continue
      const { placed: p, saved } = addCapturedSource(project.id, viewport, capture, sortOrder++, displayHostname.value)
      placed.set(viewport, p)
      imageSaves.push(saved)
    }

    const previewCapture = captured.get('desktop') ?? captured.get('tablet') ?? captured.get('mobile')
    if (previewCapture) savePreview(project.id, previewCapture.img)

    const comp = createCompositionFromPreset(placed, displayHostname.value, resolvedUrl.value)

    await Promise.all([persistAll(), ...imageSaves])
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
