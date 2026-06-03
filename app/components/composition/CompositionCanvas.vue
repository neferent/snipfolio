<template>
  <div ref="container" class="flex h-full items-center justify-center overflow-hidden bg-[var(--color-surface)] p-6">
    <div
      class="relative shadow-2xl"
      :style="{ width: previewW + 'px', height: previewH + 'px' }"
    >
      <canvas ref="canvas" class="block h-full w-full" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useElementSize } from '@vueuse/core'
import { useCanvasRenderer } from '~/composables/useCanvasRenderer'
import { useSnipsStore } from '~/stores/snips'
import { useProjectStore } from '~/stores/project'
import type { Composition } from '~/types'

const props = defineProps<{
  composition: Composition
}>()

const canvas = ref<HTMLCanvasElement>()
const container = ref<HTMLElement>()
const { render } = useCanvasRenderer()
const snipsStore = useSnipsStore()
const projectStore = useProjectStore()

const outputW = computed(() => props.composition.config.outputWidth)
const outputH = computed(() => props.composition.config.outputHeight)

// Scale to fit container maintaining aspect
const { width: containerW, height: containerH } = useElementSize(container)

const scale = computed(() => {
  if (!containerW.value || !containerH.value) return 1
  const pad = 48
  return Math.min(
    (containerW.value - pad) / outputW.value,
    (containerH.value - pad) / outputH.value,
    1,
  )
})

const previewW = computed(() => Math.round(outputW.value * scale.value))
const previewH = computed(() => Math.round(outputH.value * scale.value))

function renderCanvas() {
  const c = canvas.value
  const src = projectStore.sourceImage
  if (!c || !src) return
  render(c, {
    composition: props.composition,
    snips: snipsStore.snips,
    sourceImage: src,
  })
}

watch(
  [() => props.composition, () => snipsStore.snips, () => projectStore.sourceImage],
  () => nextTick(renderCanvas),
  { deep: true, immediate: true },
)
</script>
