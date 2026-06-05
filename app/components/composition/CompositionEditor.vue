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
      <aside class="flex w-64 flex-col overflow-y-auto border-r border-[var(--color-border)] bg-[var(--color-surface-2)]">
        <div class="border-b border-[var(--color-border)] px-4 py-3">
          <h2 class="truncate text-sm font-semibold text-[var(--color-text)]">
            {{ comp.name }}
          </h2>
        </div>

        <div class="flex-1 overflow-y-auto p-4 space-y-5">
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
      </aside>

      <!-- Center: canvas preview -->
      <div class="relative flex-1">
        <CompositionCanvas :composition="comp" />
      </div>

      <!-- Right sidebar: bg + output + export -->
      <aside class="flex w-64 flex-col overflow-y-auto border-l border-[var(--color-border)] bg-[var(--color-surface-2)]">
        <div class="border-b border-[var(--color-border)] px-4 py-3">
          <h2 class="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            Settings
          </h2>
        </div>

        <div class="flex-1 overflow-y-auto p-4 space-y-5">
          <BackgroundControls
            :model-value="collageCfg!.background"
            @update:model-value="updateCollageProp('background', $event)"
          />

          <!-- Output size -->
          <div class="space-y-2">
            <label class="text-xs font-medium text-[var(--color-text-muted)]">Output size</label>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="preset in sizePresets"
                :key="preset.label"
                class="rounded-lg border py-1.5 text-xs transition"
                :class="
                  comp.config.outputWidth === preset.w && comp.config.outputHeight === preset.h
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/15 text-[var(--color-accent)]'
                    : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-white/20'
                "
                @click="setOutputSize(preset.w, preset.h)"
              >
                {{ preset.label }}
              </button>
            </div>
            <div class="flex items-center gap-2">
              <input
                type="number"
                :value="comp.config.outputWidth"
                class="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-3)] px-2 py-1 text-xs text-[var(--color-text)] outline-none"
                placeholder="Width"
                @change="setOutputSize(Number(($event.target as HTMLInputElement).value), comp!.config.outputHeight)"
              />
              <span class="shrink-0 text-xs text-[var(--color-text-muted)]">×</span>
              <input
                type="number"
                :value="comp.config.outputHeight"
                class="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-3)] px-2 py-1 text-xs text-[var(--color-text)] outline-none"
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
              class="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-3)] px-3 py-1.5 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
              @input="updateName(($event.target as HTMLInputElement).value)"
            />
          </div>

          <!-- Export -->
          <button
            class="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-accent)] py-2 text-sm font-medium text-white transition hover:bg-[var(--color-accent-hover)]"
            @click="doExport"
          >
            <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 17l4 4 4-4m-4-12v16" />
            </svg>
            Export PNG
          </button>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCompositionsStore } from '~/stores/compositions'
import { useCompositions } from '~/composables/useCompositions'
import { useExport } from '~/composables/useExport'
import { isFreeformType, isCollageConfig } from '~/types'
import type { CollageCompositionConfig, FreeformCompositionConfig, BackgroundConfig } from '~/types'

const props = defineProps<{ compositionId: string }>()

const compositionsStore = useCompositionsStore()
const { updateComposition } = useCompositions()
const { exportComposition } = useExport()

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
  if (comp.value) exportComposition(comp.value)
}
</script>
