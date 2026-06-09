<template>
  <div class="absolute inset-0">
    <!-- Freeform types: laptop, laptop+phone, freeform -->
    <FreeformEditor
      v-if="comp && isFreeform"
      :composition="comp"
      @update-config="onUpdateFreeformConfig"
      @update-name="updateName"
      @export="doExport"
    />

    <!-- Auto-collage type -->
    <div v-else-if="comp && !isFreeform" class="absolute inset-0 flex">
      <!-- Left sidebar: gap + caption controls -->
      <aside
        class="relative flex shrink-0 flex-col overflow-y-auto border-r border-[var(--color-border)] bg-[var(--color-surface-2)]"
        :style="{ width: leftWidth + 'px' }"
      >
        <div class="px-4 py-3 border-b-subtle">
          <h2 class="truncate text-sm font-medium text-[var(--color-text)]">
            {{ comp.name }}
          </h2>
        </div>

        <div class="flex-1 overflow-y-auto space-y-5 p-4">
          <CollageLayout
            :model-value="collageCfg!"
            @update:model-value="updateCollage"
          />

          <CaptionControls
            label="Global caption"
            :model-value="collageCfg!.globalCaption"
            @update:model-value="updateCollageProp('globalCaption', $event)"
          />
        </div>

        <!-- Left drag handle -->
        <div
          class="absolute inset-y-0 right-0 z-10 w-1 cursor-col-resize hover:bg-[var(--color-accent)]/40 transition-colors"
          @mousedown="startLeftResize"
        />
      </aside>

      <!-- Center: canvas preview -->
      <div class="relative flex-1">
        <CompositionCanvas :composition="comp" />
      </div>

      <!-- Right sidebar: bg + output + export -->
      <aside
        class="relative flex shrink-0 flex-col overflow-y-auto border-l border-[var(--color-border)] bg-[var(--color-surface-2)]"
        :style="{ width: rightWidth + 'px' }"
      >
        <div class="px-4 py-3 border-b-subtle">
          <h2 class="text-[12px] font-medium tracking-wider uppercase text-[var(--color-text-faint)]">
            Settings
          </h2>
        </div>

        <div class="flex-1 overflow-y-auto space-y-5 p-4">
          <BackgroundControls
            :model-value="collageCfg!.background"
            @update:model-value="updateCollageProp('background', $event)"
          />

          <!-- Platform presets -->
          <PlatformPresets
            :current-w="comp.config.outputWidth"
            :current-h="comp.config.outputHeight"
            @select="setOutputSize"
          />

          <!-- Output size -->
          <div class="space-y-2">
            <label class="text-[12px] font-medium tracking-wider uppercase text-[var(--color-text-faint)]">Output size</label>
            <div class="grid grid-cols-2 gap-1.5">
              <button
                v-for="preset in sizePresets"
                :key="preset.label"
                class="flex h-[30px] items-center justify-center px-3 font-mono text-[12px] transition"
                :style="comp.config.outputWidth === preset.w && comp.config.outputHeight === preset.h
                  ? 'border-radius:6px;border:1.5px solid #8e9ead;background:rgba(142,158,173,0.08);color:#e2e6ea;font-weight:500'
                  : 'border-radius:6px;border:0.5px solid rgba(255,255,255,0.06);background:transparent;color:#6b7280'"
                @click="setOutputSize(preset.w, preset.h)"
              >
                {{ preset.label }}
              </button>
            </div>
            <div class="flex items-center gap-2">
              <input
                type="number"
                :value="comp.config.outputWidth"
                class="w-full font-mono"
                placeholder="Width"
                @change="setOutputSize(Number(($event.target as HTMLInputElement).value), comp!.config.outputHeight)"
              />
              <span class="shrink-0 text-xs text-[var(--color-text-muted)]">×</span>
              <input
                type="number"
                :value="comp.config.outputHeight"
                class="w-full font-mono"
                placeholder="Height"
                @change="setOutputSize(comp!.config.outputWidth, Number(($event.target as HTMLInputElement).value))"
              />
            </div>
          </div>

          <!-- Name -->
          <div class="space-y-1.5">
            <label class="text-xs font-medium text-[var(--color-text-muted)]">Name</label>
            <input
              :value="comp.name"
              class="w-full"
              @input="updateName(($event.target as HTMLInputElement).value)"
            />
          </div>

          <!-- Export -->
          <button
            class="flex h-9 w-full items-center justify-center gap-2 rounded-[6px] bg-[var(--color-accent)] text-sm font-medium transition hover:bg-[var(--color-accent-hover)] hover:text-[var(--color-text)] text-[var(--color-on-accent)]"
            @click="doExport"
          >
            <Upload class="size-4" />
            Export PNG
          </button>
        </div>

        <!-- Right drag handle -->
        <div
          class="absolute inset-y-0 left-0 z-10 w-1 cursor-col-resize hover:bg-[var(--color-accent)]/40 transition-colors"
          @mousedown="startRightResize"
        />
      </aside>
    </div>

    <!-- Export picker modal (non-Pro users) -->
    <ExportPickerModal
      :open="showExportModal"
      :preselect-id="comp?.id"
      @close="showExportModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { Upload } from 'lucide-vue-next'
import { useResizablePanel } from '~/composables/useResizablePanel'

const { width: leftWidth, startResize: startLeftResize } = useResizablePanel(256, { side: 'right', min: 180, max: 480 })
const { width: rightWidth, startResize: startRightResize } = useResizablePanel(256, { side: 'left', min: 180, max: 480 })
import { useCompositionsStore } from '~/stores/compositions'
import { useCompositions } from '~/composables/useCompositions'
import { isFreeformType, isCollageConfig } from '~/types'
import type { CollageCompositionConfig, FreeformCompositionConfig, BackgroundConfig } from '~/types'

const props = defineProps<{ compositionId: string }>()

const compositionsStore = useCompositionsStore()
const { updateComposition } = useCompositions()

const showExportModal = ref(false)

const comp = computed(() => compositionsStore.compositions.find((c) => c.id === props.compositionId))
const isFreeform = computed(() => comp.value ? isFreeformType(comp.value.type) : false)

const collageCfg = computed(() =>
  comp.value && isCollageConfig(comp.value.config) ? (comp.value.config as CollageCompositionConfig) : null,
)

const sizePresets = [
  { label: '1920×1080', w: 1920, h: 1080 },
  { label: '1080×1920', w: 1080, h: 1920 },
  { label: '1080×1080', w: 1080, h: 1080 },
  { label: '1280×720', w: 1280, h: 720 },
]

function onUpdateFreeformConfig(config: FreeformCompositionConfig) {
  if (!comp.value) return
  updateComposition(comp.value.id, { config })
}

function updateCollage(val: CollageCompositionConfig) {
  if (!comp.value) return
  updateComposition(comp.value.id, { config: val })
}

function updateCollageProp<K extends keyof CollageCompositionConfig>(
  key: K,
  value: CollageCompositionConfig[K],
) {
  if (!collageCfg.value) return
  updateCollage({ ...collageCfg.value, [key]: value })
}

function setOutputSize(w: number, h: number) {
  if (!comp.value) return
  updateComposition(comp.value.id, { config: { ...comp.value.config, outputWidth: w, outputHeight: h } as typeof comp.value.config })
}

function updateName(name: string) {
  if (!comp.value) return
  updateComposition(comp.value.id, { name })
}

function doExport() {
  showExportModal.value = true
}
</script>
