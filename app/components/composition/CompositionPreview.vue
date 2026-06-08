<template>
  <canvas ref="canvasEl" class="w-full rounded" />
</template>

<script setup lang="ts">
import { useCanvasRenderer } from '~/composables/useCanvasRenderer'
import { useSnipsStore } from '~/stores/snips'
import { useSourcesStore } from '~/stores/sources'
import { useWatermarkPreview } from '~/composables/useWatermarkPreview'
import type { Composition } from '~/types'

const props = defineProps<{ composition: Composition; watermark?: boolean }>()

const canvasEl = ref<HTMLCanvasElement>()
const snipsStore = useSnipsStore()
const sourcesStore = useSourcesStore()
const { render } = useCanvasRenderer()
const { active: watermarkFromStore } = useWatermarkPreview()
const effectiveWatermark = computed(() => props.watermark ?? watermarkFromStore.value)

onMounted(renderPreview)
watch(() => props.composition, renderPreview, { deep: true })
watch(effectiveWatermark, renderPreview)

function renderPreview() {
  if (!canvasEl.value) return
  const sourceImages = new Map(
    [...sourcesStore.loadedImages.entries()].map(([id, { img }]) => [id, img]),
  )
  render(canvasEl.value, {
    composition: props.composition,
    snips: snipsStore.snips,
    sourceImages,
    watermark: effectiveWatermark.value,
  })
}
</script>
