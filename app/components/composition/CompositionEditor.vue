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
import { useResizablePanel } from '~/composables/useResizablePanel'

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
