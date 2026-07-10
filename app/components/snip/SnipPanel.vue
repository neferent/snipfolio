<template>
  <component
    :is="mobile ? 'div' : 'aside'"
    class="relative flex shrink-0 flex-col"
    :class="mobile ? '' : 'border-l border-[var(--color-border)] bg-[var(--color-surface-2)]'"
    :style="mobile ? undefined : { width: width + 'px' }"
  >
    <div class="flex h-10 shrink-0 items-center px-4 border-b-subtle">
      <h2 class="text-[12px] font-medium tracking-wider uppercase text-[var(--color-text-faint)]">
        Snip Properties
      </h2>
    </div>

    <div v-if="snip" class="flex-1 overflow-y-auto p-4 space-y-5">
      <!-- Thumbnail preview -->
      <SnipThumbnail :snip="snip" preview />

      <!-- Label -->
      <div class="space-y-1.5">
        <label for="snip-label" class="text-xs text-[var(--color-text-muted)]">Label</label>
        <AppInput
          id="snip-label"
          :model-value="snip.label"
          @input="updateLabel(($event.target as HTMLInputElement).value)"
        />
      </div>

      <!-- Dimensions (read-only) -->
      <div class="grid grid-cols-2 gap-2">
        <div class="space-y-1">
          <label class="text-xs text-[var(--color-text-muted)]">Width</label>
          <div class="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-3)] px-3 py-1.5 text-sm text-[var(--color-text-muted)]">
            {{ snip.width }}px
          </div>
        </div>
        <div class="space-y-1">
          <label class="text-xs text-[var(--color-text-muted)]">Height</label>
          <div class="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-3)] px-3 py-1.5 text-sm text-[var(--color-text-muted)]">
            {{ snip.height }}px
          </div>
        </div>
      </div>

      <!-- Full-source viewport: scroll position control -->
      <div v-if="snip.isFullSource" class="space-y-1.5">
        <p class="text-xs text-[var(--color-text-muted)]">
          Full-source viewport — shows {{ snip.width }}×{{ snip.height }}px of a {{ sourceWidth }}×{{ sourceHeight }}px source
        </p>
        <label for="snip-scroll" class="text-xs text-[var(--color-text-muted)]">Scroll position</label>
        <div v-if="maxScroll > 0" class="flex items-center gap-2">
          <input
            id="snip-scroll"
            type="range"
            min="0"
            :max="maxScroll"
            step="1"
            :value="snip.y"
            class="flex-1"
            @input="onScrollInput(($event.target as HTMLInputElement).valueAsNumber)"
          />
          <AppInput
            type="number"
            min="0"
            :max="maxScroll"
            step="1"
            :model-value="snip.y"
            class="w-20 text-right"
            @change="onScrollInput(($event.target as HTMLInputElement).valueAsNumber)"
          />
        </div>
        <p v-if="maxScroll > 0" class="font-mono text-[10px] text-[var(--color-text-muted)]">
          {{ snip.y }}px / {{ maxScroll }}px
        </p>
        <p v-else class="text-[10px] text-[var(--color-text-muted)]">
          Source isn't taller than the viewport — nothing to scroll.
        </p>
      </div>

      <!-- Position (read-only) -->
      <div v-else class="grid grid-cols-2 gap-2">
        <div class="space-y-1">
          <label class="text-xs text-[var(--color-text-muted)]">X</label>
          <div class="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-3)] px-3 py-1.5 text-sm text-[var(--color-text-muted)]">
            {{ snip.x }}
          </div>
        </div>
        <div class="space-y-1">
          <label class="text-xs text-[var(--color-text-muted)]">Y</label>
          <div class="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-3)] px-3 py-1.5 text-sm text-[var(--color-text-muted)]">
            {{ snip.y }}
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="pt-2 space-y-2">
        <AppButton variant="secondary" class="w-full" @click="exportRaw">
          Export raw PNG
        </AppButton>
        <AppButton variant="secondary" class="w-full" @click="copyToClipboard">
          <Check v-if="copied" class="size-3.5" />
          <Copy v-else class="size-3.5" />
          {{ copied ? 'Copied!' : 'Copy to clipboard' }}
        </AppButton>
      </div>
    </div>

    <div v-else class="flex flex-1 items-center justify-center p-4">
      <p class="text-center text-xs text-[var(--color-text-muted)]">
        Select a snip to edit its properties
      </p>
    </div>

    <!-- Drag handle (desktop only) -->
    <div
      v-if="!mobile"
      class="absolute inset-y-0 left-0 z-10 w-1 cursor-col-resize hover:bg-[var(--color-accent)]/40 transition-colors"
      @mousedown="startResize"
    />
  </component>
</template>

<script setup lang="ts">
import { Check, Copy } from 'lucide-vue-next'
import { useSnipsStore } from '~/stores/snips'
import { useSourcesStore } from '~/stores/sources'
import { useResizablePanel } from '~/composables/useResizablePanel'

const props = defineProps<{ mobile?: boolean }>()

const { width, startResize } = useResizablePanel(256, { side: 'left', min: 180, max: 480 })
import { useSnips } from '~/composables/useSnips'
import { useExport } from '~/composables/useExport'

const store = useSnipsStore()
const sourcesStore = useSourcesStore()
const snipsActions = useSnips()
const { exportSnipRaw, copySnipToClipboard } = useExport()

const snip = computed(() => store.selectedSnip)
const copied = ref(false)

const source = computed(() =>
  snip.value ? sourcesStore.sources.find((s) => s.id === snip.value!.sourceImageId) : undefined,
)
const sourceWidth = computed(() => source.value?.width ?? 0)
const sourceHeight = computed(() => source.value?.height ?? 0)
const maxScroll = computed(() => {
  if (!snip.value || !source.value) return 0
  return Math.max(0, source.value.height - snip.value.height)
})

function onScrollInput(value: number) {
  if (snip.value && Number.isFinite(value)) snipsActions.updateScrollOffset(snip.value.id, value)
}

function updateLabel(label: string) {
  if (snip.value) snipsActions.updateLabel(snip.value.id, label)
}

function exportRaw() {
  if (snip.value) exportSnipRaw(snip.value)
}

async function copyToClipboard() {
  if (!snip.value) return
  const ok = await copySnipToClipboard(snip.value)
  if (ok) {
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }
}
</script>
