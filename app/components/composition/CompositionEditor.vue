<template>
  <div class="absolute inset-0 flex">
    <!-- Left sidebar: snip picker + layout -->
    <aside class="flex w-64 flex-col overflow-y-auto border-r border-[var(--color-border)] bg-[var(--color-surface-2)]">
      <div class="border-b border-[var(--color-border)] px-4 py-3">
        <div class="flex items-center gap-2">
          <NuxtLink
            :to="`/project/${projectId}`"
            class="text-[var(--color-text-muted)] transition hover:text-[var(--color-text)]"
          >
            ← Back
          </NuxtLink>
          <h2 class="truncate text-sm font-semibold text-[var(--color-text)]">
            {{ comp?.name }}
          </h2>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto p-4 space-y-5">
        <template v-if="comp && isSingle">
          <!-- Single composition controls -->
          <div class="space-y-2">
            <label class="text-xs font-medium text-[var(--color-text-muted)]">Snip</label>
            <select
              :value="singleCfg!.snipId"
              class="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-3)] px-3 py-2 text-sm text-[var(--color-text)] outline-none"
              @change="updateSingle('snipId', ($event.target as HTMLSelectElement).value)"
            >
              <option v-for="s in snips" :key="s.id" :value="s.id">{{ s.label }}</option>
            </select>
          </div>

          <div class="space-y-2">
            <label class="text-xs font-medium text-[var(--color-text-muted)]">Device Frame</label>
            <div class="grid grid-cols-2 gap-1.5">
              <button
                v-for="frame in frames"
                :key="frame.value"
                class="rounded-lg border py-1.5 text-xs transition"
                :class="
                  singleCfg!.deviceFrame === frame.value
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/15 text-[var(--color-accent)]'
                    : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-white/20'
                "
                @click="updateSingle('deviceFrame', frame.value)"
              >
                {{ frame.label }}
              </button>
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-xs font-medium text-[var(--color-text-muted)]">
              Scale: {{ Math.round(singleCfg!.scale * 100) }}%
            </label>
            <input
              type="range"
              min="0.2"
              max="1"
              step="0.01"
              :value="singleCfg!.scale"
              class="w-full accent-[var(--color-accent)]"
              @input="updateSingle('scale', Number(($event.target as HTMLInputElement).value))"
            />
          </div>

          <CaptionControls
            label="Caption"
            :model-value="singleCfg!.caption"
            @update:model-value="updateSingle('caption', $event)"
          />
        </template>

        <template v-else-if="comp && !isSingle">
          <!-- Collage controls -->
          <CollageLayout
            :model-value="collageCfg!"
            @update:model-value="updateCollage"
          />

          <CaptionControls
            label="Global caption"
            :model-value="collageCfg!.globalCaption"
            @update:model-value="updateCollageProp('globalCaption', $event)"
          />
        </template>
      </div>
    </aside>

    <!-- Center: canvas preview -->
    <div class="relative flex-1">
      <CompositionCanvas v-if="comp" :composition="comp" />
    </div>

    <!-- Right sidebar: bg + output -->
    <aside class="flex w-64 flex-col overflow-y-auto border-l border-[var(--color-border)] bg-[var(--color-surface-2)]">
      <div class="border-b border-[var(--color-border)] px-4 py-3">
        <h2 class="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          Settings
        </h2>
      </div>

      <div v-if="comp" class="flex-1 overflow-y-auto p-4 space-y-5">
        <BackgroundControls
          :model-value="bg"
          @update:model-value="updateBg"
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

        <!-- Composition name -->
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
</template>

<script setup lang="ts">
import { useCompositionsStore } from '~/stores/compositions'
import { useSnipsStore } from '~/stores/snips'
import { useCompositions } from '~/composables/useCompositions'
import { useExport } from '~/composables/useExport'
import { isSingleConfig, isCollageConfig } from '~/types'
import type {
  DeviceFrame,
  BackgroundConfig,
  SingleCompositionConfig,
  CollageCompositionConfig,
} from '~/types'

const props = defineProps<{ compositionId: string }>()

const compositionsStore = useCompositionsStore()
const snipsStore = useSnipsStore()
const { updateComposition } = useCompositions()
const { exportComposition } = useExport()
const route = useRoute()

const projectId = computed(() => route.params.id as string)
const comp = computed(() => compositionsStore.compositions.find((c) => c.id === props.compositionId))

const isSingle = computed(() => comp.value && isSingleConfig(comp.value.config))
const singleCfg = computed(() =>
  comp.value && isSingleConfig(comp.value.config) ? (comp.value.config as SingleCompositionConfig) : null,
)
const collageCfg = computed(() =>
  comp.value && isCollageConfig(comp.value.config) ? (comp.value.config as CollageCompositionConfig) : null,
)

const snips = computed(() => snipsStore.orderedSnips)

const bg = computed(
  () => (comp.value?.config as SingleCompositionConfig | CollageCompositionConfig).background,
)

const frames = [
  { value: 'none' as DeviceFrame, label: 'None' },
  { value: 'phone' as DeviceFrame, label: 'Phone' },
  { value: 'browser' as DeviceFrame, label: 'Browser' },
  { value: 'laptop' as DeviceFrame, label: 'Laptop' },
]

const sizePresets = [
  { label: '1920×1080', w: 1920, h: 1080 },
  { label: '1080×1920', w: 1080, h: 1920 },
  { label: '1080×1080', w: 1080, h: 1080 },
  { label: '1280×720', w: 1280, h: 720 },
]

function patchConfig(patch: Partial<SingleCompositionConfig | CollageCompositionConfig>) {
  if (!comp.value) return
  updateComposition(comp.value.id, { config: { ...comp.value.config, ...patch } as typeof comp.value.config })
}

function updateSingle<K extends keyof SingleCompositionConfig>(
  key: K,
  value: SingleCompositionConfig[K],
) {
  patchConfig({ [key]: value } as Partial<SingleCompositionConfig>)
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

function updateBg(bg: BackgroundConfig) {
  patchConfig({ background: bg })
}

function setOutputSize(w: number, h: number) {
  patchConfig({ outputWidth: w, outputHeight: h })
}

function updateName(name: string) {
  if (!comp.value) return
  updateComposition(comp.value.id, { name })
}

function doExport() {
  if (comp.value) exportComposition(comp.value)
}
</script>
