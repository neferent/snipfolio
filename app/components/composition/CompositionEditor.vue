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
      <!-- Left sidebar: gap + caption controls (desktop) -->
      <aside
        v-if="!isMobile"
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
      <div class="relative flex-1" :class="isMobile ? 'pb-20' : ''">
        <CompositionCanvas :composition="comp" />
      </div>

      <!-- Right sidebar: bg + output + export (desktop) -->
      <aside
        v-if="!isMobile"
        class="relative flex shrink-0 flex-col overflow-y-auto border-l border-[var(--color-border)] bg-[var(--color-surface-2)]"
        :style="{ width: rightWidth + 'px' }"
      >
        <CompositionSettingsPanel
          :composition="comp"
          :background="collageCfg!.background"
          :output-width="comp.config.outputWidth"
          :output-height="comp.config.outputHeight"
          :name="comp.name"
          @update:background="updateCollageProp('background', $event)"
          @update:output-size="setOutputSize"
          @update:name="updateName"
          @export="doExport"
        />

        <!-- Right drag handle -->
        <div
          class="absolute inset-y-0 left-0 z-10 w-1 cursor-col-resize hover:bg-[var(--color-accent)]/40 transition-colors"
          @mousedown="startRightResize"
        />
      </aside>

      <!-- Mobile: bottom sheets + toolbar for auto-collage -->
      <template v-if="isMobile">
        <AppBottomSheet
          :open="showCollageSettingsSheet"
          title="Settings"
          :snap-points="['half', 'full']"
          @close="showCollageSettingsSheet = false"
        >
          <div class="space-y-5">
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
          <div class="mt-4 border-t border-[var(--color-border)] pt-4">
            <CompositionSettingsPanel
              :composition="comp"
              :background="collageCfg!.background"
              :output-width="comp.config.outputWidth"
              :output-height="comp.config.outputHeight"
              :name="comp.name"
              @update:background="updateCollageProp('background', $event)"
              @update:output-size="setOutputSize"
              @update:name="updateName"
              @export="doExport"
            />
          </div>
        </AppBottomSheet>

        <div class="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-[var(--color-border)] bg-[var(--color-surface-2)]/90 px-2 py-2 pb-safe backdrop-blur-lg">
          <button
            class="flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[var(--color-text-muted)] transition active:bg-overlay/10"
            @click="showCollageSettingsSheet = true"
          >
            <Settings class="size-5" />
            <span class="text-[10px]">Settings</span>
          </button>
          <button
            class="flex flex-col items-center gap-0.5 rounded-lg bg-[var(--color-accent)] px-5 py-1.5 text-[var(--color-on-accent)] transition active:bg-[var(--color-accent-hover)]"
            @click="doExport"
          >
            <ArrowUpFromLine class="size-5" />
            <span class="text-[10px] font-medium">Export</span>
          </button>
        </div>
      </template>
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
import { Settings, ArrowUpFromLine } from 'lucide-vue-next'
import { useResizablePanel } from '~/composables/useResizablePanel'

const isMobile = useIsMobile()
const showCollageSettingsSheet = ref(false)

const { width: leftWidth, startResize: startLeftResize } = useResizablePanel(256, { side: 'right', min: 180, max: 480 })
const { width: rightWidth, startResize: startRightResize } = useResizablePanel(256, { side: 'left', min: 180, max: 480 })
import { useCompositionsStore } from '~/stores/compositions'
import { useCompositions } from '~/composables/useCompositions'
import { isFreeformType, isCollageConfig } from '~/types'
import type { CollageCompositionConfig, FreeformCompositionConfig } from '~/types'

const props = defineProps<{ compositionId: string }>()

const compositionsStore = useCompositionsStore()
const { updateComposition } = useCompositions()

const showExportModal = ref(false)

// Returning from checkout (e.g. day-pass purchase) reopens the export modal
const route = useRoute()
if (route.query.export === '1') {
  showExportModal.value = true
  const { export: _export, ...query } = route.query
  navigateTo({ path: route.path, query }, { replace: true })
}

const comp = computed(() => compositionsStore.compositions.find((c) => c.id === props.compositionId))
const isFreeform = computed(() => comp.value ? isFreeformType(comp.value.type) : false)

const collageCfg = computed(() =>
  comp.value && isCollageConfig(comp.value.config) ? (comp.value.config as CollageCompositionConfig) : null,
)

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
