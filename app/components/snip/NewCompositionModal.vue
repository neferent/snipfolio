<template>
  <AppModal :open="open" title="New Composition" max-width="820px" @close="$emit('close')">
    <div class="flex gap-5">
      <!-- Left: form controls -->
      <div class="w-64 shrink-0 space-y-4">
        <div class="space-y-1.5">
          <label class="text-xs font-medium text-[var(--color-text-muted)]">Name</label>
          <input
            v-model="name"
            class="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-3)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
            placeholder="My composition"
          />
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-medium text-[var(--color-text-muted)]">Background</label>
          <div class="flex items-center gap-2">
            <input
              v-model="backgroundColor"
              type="color"
              class="h-8 w-10 cursor-pointer rounded border border-[var(--color-border)] bg-transparent p-0.5"
            />
            <span class="font-mono text-xs text-[var(--color-text-muted)]">{{ backgroundColor }}</span>
          </div>
        </div>

        <!-- Type picker -->
        <div class="space-y-2">
          <label class="text-xs font-medium text-[var(--color-text-muted)]">Type</label>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="t in types"
              :key="t.value"
              class="rounded-lg border p-3 text-sm transition text-left"
              :class="
                type === t.value
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/15 text-[var(--color-accent)]'
                  : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-white/20'
              "
              @click="type = t.value"
            >
              <div class="text-lg">{{ t.icon }}</div>
              <div class="mt-1 font-medium text-xs">{{ t.label }}</div>
              <div class="text-[10px] opacity-70 leading-tight mt-0.5">{{ t.hint }}</div>
            </button>
          </div>
        </div>

        <!-- Snip selector — adapts per type -->
        <div class="space-y-2">
          <!-- Laptop: single radio -->
          <template v-if="type === 'laptop'">
            <label class="text-xs font-medium text-[var(--color-text-muted)]">Laptop snip</label>
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
              <p v-if="laptopSnips.length === 0" class="px-2 py-2 text-xs text-[var(--color-text-muted)]">No laptop snips yet</p>
            </div>
          </template>

          <!-- Laptop + Phone: two separate pickers -->
          <template v-else-if="type === 'laptop+phone'">
            <label class="text-xs font-medium text-[var(--color-text-muted)]">Laptop snip</label>
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
              <p v-if="laptopSnips.length === 0" class="px-2 py-2 text-xs text-[var(--color-text-muted)]">No laptop snips yet</p>
            </div>
            <label class="text-xs font-medium text-[var(--color-text-muted)]">Phone snip</label>
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
              <p v-if="phoneSnips.length === 0" class="px-2 py-2 text-xs text-[var(--color-text-muted)]">No phone snips yet</p>
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
        <div class="flex-1 overflow-hidden rounded-lg border border-[var(--color-border)]" style="min-height: 260px">
          <CompositionCanvas v-if="previewComposition" :composition="previewComposition" />
          <div v-else class="flex h-full items-center justify-center text-xs text-[var(--color-text-muted)]">
            {{ previewHint }}
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <button
        class="rounded-lg px-3 py-1.5 text-sm text-[var(--color-text-muted)] transition hover:bg-white/10"
        @click="$emit('close')"
      >
        Cancel
      </button>
      <button
        class="rounded-lg bg-[var(--color-accent)] px-4 py-1.5 text-sm font-medium text-white transition hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
        :disabled="!canCreate"
        @click="create"
      >
        Create
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { useSnipsStore } from '~/stores/snips'
import { useProjectStore } from '~/stores/project'
import { useCompositions } from '~/composables/useCompositions'
import type { Composition, FreeformCompositionConfig, CollageCompositionConfig } from '~/types'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const snipsStore = useSnipsStore()
const projectStore = useProjectStore()
const { createLaptopComposition, createLaptopPhoneComposition, createAutoComposition, createFreeformComposition } = useCompositions()
const router = useRouter()
const route = useRoute()

const name = ref('')
const type = ref<'laptop' | 'laptop+phone' | 'auto' | 'freeform'>('laptop')
const laptopSnipId = ref<string>('')
const phoneSnipId = ref<string>('')
const selectedIds = ref<string[]>([])
const backgroundColor = ref('#1a1a2e')
const snips = computed(() => snipsStore.orderedSnips)
const laptopSnips = computed(() => snipsStore.orderedSnips.filter((s) => s.snapFrame === 'laptop'))
const phoneSnips = computed(() => snipsStore.orderedSnips.filter((s) => s.snapFrame === 'phone'))

const types = [
  { value: 'laptop' as const, icon: '💻', label: 'Laptop', hint: 'One snip in a laptop frame' },
  { value: 'laptop+phone' as const, icon: '💻📱', label: 'Laptop + Phone', hint: 'Two snips side by side' },
  { value: 'auto' as const, icon: '⊞', label: 'Auto-Collage', hint: 'Justified grid · no frames' },
  { value: 'freeform' as const, icon: '✦', label: 'Free-form', hint: 'Place and frame freely' },
]

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
  if (type.value === 'laptop') return 'Select a laptop snip to preview'
  if (type.value === 'laptop+phone') return 'Select both snips to preview'
  if (type.value === 'auto') return 'Select 2+ snips to preview'
  return 'Select snips to preview (optional)'
})

const previewComposition = computed<Composition | null>(() => {
  const projectId = projectStore.current?.id ?? ''
  const outputWidth = 1920
  const outputHeight = 1080

  if (type.value === 'laptop') {
    if (!laptopSnipId.value) return null
    const snip = snipsStore.snips.find((s) => s.id === laptopSnipId.value)
    // Laptop frame SVG aspect ≈ 1.657
    const slotH = outputHeight * 0.68
    const slotW = slotH * (3809.99 / 2300)
    const config: FreeformCompositionConfig = {
      slots: [{
        id: '__preview_slot__',
        snipId: laptopSnipId.value,
        deviceFrame: 'laptop',
        x: Math.round(outputWidth / 2 - slotW / 2),
        y: Math.round(outputHeight / 2 - slotH / 2),
        width: Math.round(slotW),
        height: Math.round(slotH),
      }],
      background: bg.value,
      outputWidth,
      outputHeight,
    }
    return { id: '__preview__', projectId, name: 'Preview', type: 'laptop', sortOrder: 0, config }
  }

  if (type.value === 'laptop+phone') {
    if (!laptopSnipId.value || !phoneSnipId.value) return null
    const lapH = outputHeight * 0.68
    const lapW = lapH * (3809.99 / 2300)
    const phoneH = outputHeight * 0.78
    const phoneW = phoneH * (772.5 / 1600)
    const config: FreeformCompositionConfig = {
      slots: [
        {
          id: '__preview_slot_laptop__',
          snipId: laptopSnipId.value,
          deviceFrame: 'laptop',
          x: Math.round(outputWidth * 0.38 - lapW / 2),
          y: Math.round(outputHeight / 2 - lapH / 2),
          width: Math.round(lapW),
          height: Math.round(lapH),
        },
        {
          id: '__preview_slot_phone__',
          snipId: phoneSnipId.value,
          deviceFrame: 'phone',
          x: Math.round(outputWidth * 0.72 - phoneW / 2),
          y: Math.round(outputHeight / 2 - phoneH / 2),
          width: Math.round(phoneW),
          height: Math.round(phoneH),
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
  const cols = Math.ceil(Math.sqrt(selectedIds.value.length))
  const slots = selectedIds.value.map((snipId, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    const cx = (outputWidth / (cols + 1)) * (col + 1)
    const cy = (outputHeight / (Math.ceil(selectedIds.value.length / cols) + 1)) * (row + 1)
    const snip = snipsStore.snips.find((s) => s.id === snipId)
    const aspect = snip ? snip.width / snip.height : 1
    const h = outputHeight * 0.5
    const w = h * aspect
    return {
      id: `__preview_slot_${i}__`,
      snipId,
      deviceFrame: 'none' as const,
      x: Math.round(cx - w / 2),
      y: Math.round(cy - h / 2),
      width: Math.round(w),
      height: Math.round(h),
    }
  })
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

function create() {
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
  router.push(`/project/${route.params.id}/compose/${comp.id}`)
}
</script>
