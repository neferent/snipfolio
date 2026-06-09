<template>
  <div
    class="flex flex-col items-center justify-center transition-colors"
    :class="isDragOver ? 'bg-[rgba(142,158,173,0.04)]' : 'bg-[var(--color-surface-2)]'"
    :style="{
      borderRadius: '12px',
      border: isDragOver ? '1.5px dashed #8e9ead' : '1.5px dashed rgba(255,255,255,0.12)',
      padding: '48px 32px',
    }"
    @dragover.prevent="isDragOver = true"
    @dragleave="isDragOver = false"
    @drop.prevent="onDrop"
  >
    <ImageIcon class="mb-3 size-10 text-[var(--color-text-muted)]" :stroke-width="1.5" />
    <p class="mb-1 text-sm font-medium text-[var(--color-text)]">Drop your screenshot here</p>
    <p class="mt-1 text-xs text-[var(--color-text-muted)]">PNG, JPG, or WebP</p>
    <button
      class="mt-4 flex h-8 items-center rounded-[6px] border-strong px-4 text-sm text-[var(--color-text)] transition hover:bg-white/5"
      @click="fileInput?.click()"
    >
      Choose file
    </button>
    <input
      ref="fileInput"
      type="file"
      accept="image/png,image/jpeg,image/webp"
      class="hidden"
      @change="onFileChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ImageIcon } from 'lucide-vue-next'

const emit = defineEmits<{
  loaded: [img: HTMLImageElement, src: string, filename: string]
}>()

const isDragOver = ref(false)
const fileInput = ref<HTMLInputElement>()

function loadFile(file: File) {
  if (!file.type.startsWith('image/')) return
  const reader = new FileReader()
  reader.onload = (e) => {
    const src = e.target?.result as string
    const img = new Image()
    img.onload = () => emit('loaded', img, src, file.name)
    img.src = src
  }
  reader.readAsDataURL(file)
}

function onDrop(e: DragEvent) {
  isDragOver.value = false
  const file = e.dataTransfer?.files[0]
  if (file) loadFile(file)
}

function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) loadFile(file)
}
</script>
