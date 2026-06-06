<template>
  <canvas ref="canvasEl" class="w-full rounded" />
</template>

<script setup lang="ts">
import { useCanvasRenderer } from '~/composables/useCanvasRenderer'
import { useSnipsStore } from '~/stores/snips'
import { useSourcesStore } from '~/stores/sources'
import { useWatermarkPreview } from '~/composables/useWatermarkPreview'
import type { Composition } from '~/types'

const props = defineProps<{ composition: Composition }>()

const canvasEl = ref<HTMLCanvasElement>()
const snipsStore = useSnipsStore()
const sourcesStore = useSourcesStore()
const { render } = useCanvasRenderer()
const { active: watermark } = useWatermarkPreview()

onMounted(renderPreview)
watch(() => props.composition, renderPreview, { deep: true })
watch(watermark, renderPreview)

function renderPreview() {
  if (!canvasEl.value) return
  const sourceImages = new Map(
    [...sourcesStore.loadedImages.entries()].map(([id, { img }]) => [id, img]),
  )
  render(canvasEl.value, {
    composition: props.composition,
    snips: snipsStore.snips,
    sourceImages,
    watermark: watermark.value,
  })
}
</script>
