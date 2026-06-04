<template>
  <canvas ref="canvas" class="block" :class="preview ? 'w-full rounded-lg' : 'rounded object-cover'" />
</template>

<script setup lang="ts">
import { useSourcesStore } from '~/stores/sources'
import type { Snip } from '~/types'

const props = defineProps<{
  snip: Snip
  preview?: boolean
}>()

const canvas = ref<HTMLCanvasElement>()
const sourcesStore = useSourcesStore()

function draw() {
  const c = canvas.value
  const loaded = sourcesStore.getImage(props.snip.sourceImageId)
  if (!c || !loaded) return
  const src = loaded.img

  if (props.preview) {
    const maxPx = 512
    const scale = Math.min(maxPx / props.snip.width, maxPx / props.snip.height, 1)
    c.width = Math.round(props.snip.width * scale)
    c.height = Math.round(props.snip.height * scale)
    const ctx = c.getContext('2d')!
    ctx.drawImage(src, props.snip.x, props.snip.y, props.snip.width, props.snip.height, 0, 0, c.width, c.height)
  } else {
    c.width = 36
    c.height = 36
    const ctx = c.getContext('2d')!
    const aspect = props.snip.width / props.snip.height
    let sw = props.snip.width
    let sh = props.snip.height
    let sx = props.snip.x
    let sy = props.snip.y
    if (aspect > 1) { sx += (sw - sh) / 2; sw = sh }
    else { sy += (sh - sw) / 2; sh = sw }
    ctx.drawImage(src, sx, sy, sw, sh, 0, 0, 36, 36)
  }
}

onMounted(draw)
watch(() => [props.snip, props.preview, sourcesStore.loadedImages], draw, { deep: true })
</script>
