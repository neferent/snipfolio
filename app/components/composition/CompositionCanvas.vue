<template>
  <div ref="container" class="relative flex h-full flex-col items-center justify-center overflow-hidden bg-[var(--color-surface)] p-6">
    <div
      class="relative"
      :style="{
        width: previewW + 'px',
        height: previewH + 'px',
        opacity: resizing ? 0 : 1,
        transition: resizing ? 'none' : 'opacity 175ms linear',
      }"
    >
      <canvas ref="canvas" class="block h-full w-full" />
    </div>
    <div class="absolute bottom-4 left-1/2 -translate-x-1/2">
      <WatermarkToggle />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useElementSize } from '@vueuse/core'
import { useCanvasRenderer } from '~/composables/useCanvasRenderer'
import { useSnipsStore } from '~/stores/snips'
import { useSourcesStore } from '~/stores/sources'
import { useWatermarkPreview } from '~/composables/useWatermarkPreview'
import type { Composition } from '~/types'

const props = defineProps<{
  composition: Composition
}>()

const canvas = ref<HTMLCanvasElement>()
const container = ref<HTMLElement>()
const { render } = useCanvasRenderer()
const snipsStore = useSnipsStore()
const sourcesStore = useSourcesStore()
const { active: watermark } = useWatermarkPreview()

const loadedBgImage = ref<HTMLImageElement | undefined>()

watch(
  () => props.composition.config.background,
  (bg) => {
    if (bg.type === 'image' && bg.imageDataUrl) {
      const img = new Image()
      img.onload = () => { loadedBgImage.value = img }
      img.src = bg.imageDataUrl
    } else {
      loadedBgImage.value = undefined
    }
  },
  { immediate: true, deep: false },
)

const outputW = computed(() => props.composition.config.outputWidth)
const outputH = computed(() => props.composition.config.outputHeight)

const { width: containerW, height: containerH } = useElementSize(container)

const containerReady = computed(() => containerW.value > 0 && containerH.value > 0)

const scale = computed(() => {
  if (!containerReady.value) return 0
  const pad = 48
  return Math.min(
    (containerW.value - pad) / outputW.value,
    (containerH.value - pad) / outputH.value,
    1,
  )
})

const previewW = computed(() => Math.round(outputW.value * scale.value))
const previewH = computed(() => Math.round(outputH.value * scale.value))

// Crossfade out/in across discrete output-size changes (and the initial size
// measurement) instead of snapping or stretching the canvas
const resizing = ref(true)
watch([outputW, outputH, containerReady], async () => {
  resizing.value = true
  await nextTick()
  requestAnimationFrame(() => { resizing.value = false })
})

function buildSourceImagesMap(): Map<string, HTMLImageElement> {
  const map = new Map<string, HTMLImageElement>()
  for (const [id, { img }] of sourcesStore.loadedImages) {
    map.set(id, img)
  }
  return map
}

function renderCanvas() {
  const c = canvas.value
  if (!c || sourcesStore.loadedImages.size === 0) return
  render(c, {
    composition: props.composition,
    snips: snipsStore.snips,
    sourceImages: buildSourceImagesMap(),
    backgroundImage: loadedBgImage.value,
    watermark: watermark.value,
  })
}

watch(
  [() => props.composition, () => snipsStore.snips, () => sourcesStore.loadedImages, watermark, loadedBgImage],
  () => nextTick(renderCanvas),
  { deep: true, immediate: true },
)
</script>
