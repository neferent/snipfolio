<template>
  <div class="flex h-10 shrink-0 items-center px-4 border-b-subtle">
    <h2 class="text-[12px] font-medium tracking-wider uppercase text-[var(--color-text-faint)]">Settings</h2>
  </div>

  <div class="flex-1 overflow-y-auto p-4 space-y-5">
    <div class="space-y-1.5">
      <label class="text-[12px] font-medium tracking-wider uppercase text-[var(--color-text-faint)]">Background</label>
      <BackgroundControls :model-value="background" @update:model-value="$emit('update:background', $event)" />
    </div>

    <!-- Platform presets -->
    <PlatformPresets
      :current-w="outputWidth"
      :current-h="outputHeight"
      @select="(w, h) => $emit('update:output-size', w, h)"
    />

    <!-- Output size -->
    <div class="space-y-2">
      <label class="text-[12px] font-medium tracking-wider uppercase text-[var(--color-text-faint)]">Output size</label>
      <div class="grid grid-cols-2 gap-1.5">
        <button
          v-for="preset in sizePresets"
          :key="preset.label"
          class="flex h-[30px] items-center justify-center px-3 font-mono text-[12px] transition"
          :style="outputWidth === preset.w && outputHeight === preset.h
            ? 'border-radius:6px;border:1.5px solid var(--color-accent);background:rgba(142,158,173,0.08);color:var(--color-text);font-weight:500'
            : 'border-radius:6px;border:0.5px solid var(--color-border);background:transparent;color:var(--color-text-muted)'"
          @click="$emit('update:output-size', preset.w, preset.h)"
        >
          {{ preset.label }}
        </button>
      </div>
      <div class="flex items-center gap-2">
        <AppInput
          type="number"
          :model-value="outputWidth"
          class="w-full font-mono"
          placeholder="Width"
          @change="$emit('update:output-size', Number(($event.target as HTMLInputElement).value), outputHeight)"
        />
        <span class="shrink-0 text-xs text-[var(--color-text-muted)]">×</span>
        <AppInput
          type="number"
          :model-value="outputHeight"
          class="w-full font-mono"
          placeholder="Height"
          @change="$emit('update:output-size', outputWidth, Number(($event.target as HTMLInputElement).value))"
        />
      </div>
    </div>

    <!-- Composition name -->
    <div class="space-y-1.5">
      <label class="text-xs font-medium text-[var(--color-text-muted)]">Name</label>
      <AppInput
        :model-value="name"
        @input="$emit('update:name', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <!-- Export -->
    <div class="flex flex-col gap-2">
      <AppButton size="lg" @click="$emit('export')">
        <Upload class="size-4" />
        Export PNG
      </AppButton>
      <AppButton variant="secondary" size="lg" @click="copyToClipboard">
        <Check v-if="copied" class="size-4" />
        <Copy v-else class="size-4" />
        {{ copied ? 'Copied!' : 'Copy to clipboard' }}
      </AppButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Upload, Copy, Check } from 'lucide-vue-next'
import { useExport } from '~/composables/useExport'
import type { BackgroundConfig, Composition } from '~/types'

const props = defineProps<{
  background: BackgroundConfig
  outputWidth: number
  outputHeight: number
  name: string
  composition: Composition
}>()

defineEmits<{
  'update:background': [bg: BackgroundConfig]
  'update:output-size': [w: number, h: number]
  'update:name': [name: string]
  'export': []
}>()

const { copyCompositionToClipboard } = useExport()
const copied = ref(false)

async function copyToClipboard() {
  const ok = await copyCompositionToClipboard(props.composition, false)
  if (ok) {
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }
}

const sizePresets = [
  { label: '1920×1080', w: 1920, h: 1080 },
  { label: '1080×1920', w: 1080, h: 1920 },
  { label: '1080×1080', w: 1080, h: 1080 },
  { label: '1280×720', w: 1280, h: 720 },
]
</script>
