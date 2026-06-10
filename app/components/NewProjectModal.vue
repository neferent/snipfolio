<template>
  <AppModal :open="open" :title="modalTitle" @close="onClose">
    <!-- Step 1: Choose project type -->
    <div v-if="step === 'choose'" class="grid grid-cols-2 gap-3">
      <button
        class="flex flex-col gap-2 rounded-lg border border-white/10 p-4 text-left transition hover:border-white/20 hover:bg-white/5"
        @click="step = 'blank'"
      >
        <span class="text-sm font-medium text-[var(--color-text)]">Blank</span>
        <span class="text-xs text-[var(--color-text-muted)]">Start empty, add screenshots manually</span>
      </button>
      <button
        class="flex flex-col gap-2 rounded-lg border border-white/10 p-4 text-left transition hover:border-white/20 hover:bg-white/5"
        @click="step = 'url'"
      >
        <div class="flex items-center gap-2">
          <span class="text-sm font-medium text-[var(--color-text)]">From URL</span>
          <span class="rounded px-1.5 py-0.5 text-[10px] font-semibold bg-[var(--color-accent)]/20 text-[var(--color-accent)]">Pro</span>
        </div>
        <span class="text-xs text-[var(--color-text-muted)]">Capture desktop &amp; mobile, compose instantly</span>
      </button>
    </div>

    <!-- Step 2a: Blank project name -->
    <div v-else-if="step === 'blank'" class="space-y-1.5">
      <label class="text-xs font-medium text-[var(--color-text-muted)]">Project name</label>
      <input
        ref="nameInputRef"
        v-model="name"
        class="w-full"
        placeholder="My project"
        @keydown.enter="onCreateBlank"
      />
    </div>

    <!-- Step 2b: URL entry -->
    <div v-else-if="step === 'url'" class="space-y-3">
      <div class="space-y-1.5">
        <label class="text-xs font-medium text-[var(--color-text-muted)]">URL</label>
        <input
          ref="urlInputRef"
          v-model="url"
          type="text"
          inputmode="url"
          class="w-full"
          placeholder="https://example.com"
          @input="onUrlInput"
          @keydown.enter="onStartCapture"
        />
      </div>
      <div class="space-y-1.5">
        <label class="text-xs font-medium text-[var(--color-text-muted)]">Project name</label>
        <input
          v-model="name"
          class="w-full"
          placeholder="example.com"
          @focus="nameFocused = true"
          @blur="nameFocused = false"
          @keydown.enter="onStartCapture"
        />
      </div>
      <p class="text-xs text-[var(--color-text-muted)]">Captures desktop + mobile viewports</p>
    </div>

    <!-- Step 3: Capturing -->
    <div v-else-if="step === 'capturing'" class="space-y-3">
      <p class="text-xs text-[var(--color-text-muted)]">
        {{ captureError ? 'Capture failed' : `Capturing ${displayHostname}…` }}
      </p>
      <div class="flex items-end gap-2">
        <!-- Desktop pill (160px wide) -->
        <div class="flex flex-col overflow-hidden rounded border border-white/10" style="width: 160px;">
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
        <!-- Mobile pill (43px wide — 390/1440 * 160) -->
        <div class="flex flex-col overflow-hidden rounded border border-white/10" style="width: 43px;">
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

    <template #footer>
      <!-- Step 1: no buttons -->
      <template v-if="step === 'choose'" />

      <!-- Step 2a: blank -->
      <template v-else-if="step === 'blank'">
        <button
          class="flex h-8 items-center rounded-[6px] px-3 text-sm text-[var(--color-text-muted)] transition hover:bg-white/5"
          @click="step = 'choose'"
        >
          Back
        </button>
        <button
          class="flex h-8 items-center rounded-[6px] bg-[var(--color-accent)] px-4 text-sm font-medium text-[var(--color-on-accent)] transition hover:bg-[var(--color-accent-hover)] hover:text-[var(--color-text)] disabled:opacity-50"
          :disabled="!name.trim()"
          @click="onCreateBlank"
        >
          Create
        </button>
      </template>

      <!-- Step 2b: url -->
      <template v-else-if="step === 'url'">
        <button
          class="flex h-8 items-center rounded-[6px] px-3 text-sm text-[var(--color-text-muted)] transition hover:bg-white/5"
          @click="step = 'choose'"
        >
          Back
        </button>
        <button
          class="flex h-8 items-center rounded-[6px] bg-[var(--color-accent)] px-4 text-sm font-medium text-[var(--color-on-accent)] transition hover:bg-[var(--color-accent-hover)] hover:text-[var(--color-text)] disabled:opacity-50"
          :disabled="!resolvedUrl || !name.trim()"
          @click="onStartCapture"
        >
          Capture &amp; Create
        </button>
      </template>

      <!-- Step 3: capturing — only show buttons on error -->
      <template v-else-if="step === 'capturing' && captureError">
        <button
          class="flex h-8 items-center rounded-[6px] px-3 text-sm text-[var(--color-text-muted)] transition hover:bg-white/5"
          @click="step = 'url'"
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
import { useProject } from '~/composables/useProject'
import { useProjectStore } from '~/stores/project'
import { useSourcesStore } from '~/stores/sources'
import { useSnipsStore } from '~/stores/snips'
import { useCompositionsStore } from '~/stores/compositions'
import { useSnips } from '~/composables/useSnips'
import { useCompositions } from '~/composables/useCompositions'
import type { SourceImage } from '~/types'

// Screen area aspect ratios (width/height) matching the SVG frame definitions
const LAPTOP_SCREEN_ASPECT = 3034.7 / 1964.07  // ≈ 1.545
const PHONE_SCREEN_ASPECT  = 709.65 / 1539.77  // ≈ 0.461

type Step = 'choose' | 'blank' | 'url' | 'capturing'
type CaptureStatus = 'idle' | 'loading' | 'done' | 'error'

const props = defineProps<{ open: boolean }>()
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
const { createLaptopPhoneComposition, createLaptopComposition } = useCompositions()

const step = ref<Step>('choose')
const name = ref('')
const url = ref('')
const nameFocused = ref(false)
const prevHostname = ref('')

const desktopStatus = ref<CaptureStatus>('idle')
const mobileStatus = ref<CaptureStatus>('idle')
const desktopSrc = ref('')
const mobileSrc = ref('')
const captureError = ref('')

const nameInputRef = ref<HTMLInputElement>()
const urlInputRef = ref<HTMLInputElement>()

const resolvedUrl = computed(() => {
  if (!url.value) return ''
  if (url.value.startsWith('http://') || url.value.startsWith('https://')) return url.value
  return `https://${url.value}`
})

const displayHostname = computed(() => {
  try { return new URL(resolvedUrl.value).hostname } catch { return url.value }
})

const modalTitle = computed(() => {
  if (step.value === 'capturing') return captureError.value ? 'Capture failed' : `Capturing ${displayHostname.value}…`
  if (step.value === 'url') return 'New Project from URL'
  return 'New Project'
})

watch(step, (s) => {
  nextTick(() => {
    if (s === 'blank') nameInputRef.value?.focus()
    if (s === 'url') urlInputRef.value?.focus()
  })
})

watch(() => props.open, (v) => { if (!v) reset() })

function reset() {
  step.value = 'choose'
  name.value = ''
  url.value = ''
  prevHostname.value = ''
  nameFocused.value = false
  desktopStatus.value = 'idle'
  mobileStatus.value = 'idle'
  desktopSrc.value = ''
  mobileSrc.value = ''
  captureError.value = ''
}

function onClose() {
  emit('close')
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

async function captureOne(viewport: 'desktop' | 'mobile'): Promise<{ img: HTMLImageElement; src: string } | null> {
  if (viewport === 'desktop') desktopStatus.value = 'loading'
  else mobileStatus.value = 'loading'
  try {
    const res = await fetch('/api/screenshot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

async function onStartCapture() {
  if (!resolvedUrl.value || !name.value.trim()) return
  step.value = 'capturing'
  captureError.value = ''
  desktopStatus.value = 'idle'
  mobileStatus.value = 'idle'
  desktopSrc.value = ''
  mobileSrc.value = ''

  const [desktop, mobile] = await Promise.all([
    captureOne('desktop'),
    captureOne('mobile'),
  ])

  if (!desktop && !mobile) {
    captureError.value = 'Both captures failed. Check the URL and try again.'
    return
  }

  try {
    const project = await createProjectFn(name.value.trim())

    // Initialize stores for the new empty project
    projectStore.setProject(project)
    sourcesStore.setSources([])
    snipsStore.setSnips([])
    compositionsStore.setCompositions([])

    let desktopSnipId: string | null = null
    let mobileSnipId: string | null = null

    if (desktop) {
      const sourceId = crypto.randomUUID()
      const source: SourceImage = {
        id: sourceId,
        projectId: project.id,
        label: `${displayHostname.value} desktop`,
        filename: `${displayHostname.value}-desktop.png`,
        width: desktop.img.naturalWidth,
        height: desktop.img.naturalHeight,
        sortOrder: 0,
      }
      sourcesStore.addSource(source)
      sourcesStore.setLoadedImage(sourceId, desktop.img, desktop.src)
      sourcesStore.setActiveSource(sourceId)
      saveImage(project.id, sourceId, desktop.src)
      const snipH = Math.min(desktop.img.naturalHeight, Math.round(desktop.img.naturalWidth / LAPTOP_SCREEN_ASPECT))
      const snip = createSnip(0, 0, desktop.img.naturalWidth, snipH, 'laptop', sourceId)
      desktopSnipId = snip.id
    }

    if (mobile) {
      const sourceId = crypto.randomUUID()
      const source: SourceImage = {
        id: sourceId,
        projectId: project.id,
        label: `${displayHostname.value} mobile`,
        filename: `${displayHostname.value}-mobile.png`,
        width: mobile.img.naturalWidth,
        height: mobile.img.naturalHeight,
        sortOrder: desktop ? 1 : 0,
      }
      sourcesStore.addSource(source)
      sourcesStore.setLoadedImage(sourceId, mobile.img, mobile.src)
      sourcesStore.setActiveSource(sourceId)
      saveImage(project.id, sourceId, mobile.src)
      const snipH = Math.min(mobile.img.naturalHeight, Math.round(mobile.img.naturalWidth / PHONE_SCREEN_ASPECT))
      const snip = createSnip(0, 0, mobile.img.naturalWidth, snipH, 'phone', sourceId)
      mobileSnipId = snip.id
    }

    let comp
    if (desktopSnipId && mobileSnipId) {
      comp = createLaptopPhoneComposition(desktopSnipId, mobileSnipId, displayHostname.value)
    } else {
      comp = createLaptopComposition((desktopSnipId ?? mobileSnipId)!, displayHostname.value)
    }

    await persistAll()
    emit('composed', project.id, comp.id)
  } catch {
    captureError.value = 'Failed to create project. Please try again.'
  }
}
</script>
