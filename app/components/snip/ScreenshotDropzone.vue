<template>
  <div
    class="flex h-80 w-96 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface-2)] transition-colors"
    :class="isDragOver ? 'border-[var(--color-accent)] bg-indigo-500/5' : ''"
    @dragover.prevent="isDragOver = true"
    @dragleave="isDragOver = false"
    @drop.prevent="onDrop"
  >
    <svg class="mb-3 size-10 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
      <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M13.5 12h.008v.008H13.5V12zm0 0H9m4.06-7.19l-4.5-4.5a1.125 1.125 0 00-1.591 0l-4.5 4.5" />
    </svg>
    <p class="mb-1 text-sm font-medium text-[var(--color-text)]">Drop your screenshot here</p>
    <p class="mb-4 text-xs text-[var(--color-text-muted)]">PNG, JPG, or WebP</p>
    <button
      class="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-accent-hover)]"
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
const emit = defineEmits<{
  loaded: [img: HTMLImageElement, src: string]
}>()

const isDragOver = ref(false)
const fileInput = ref<HTMLInputElement>()

function loadFile(file: File) {
  if (!file.type.startsWith('image/')) return
  const reader = new FileReader()
  reader.onload = (e) => {
    const src = e.target?.result as string
    const img = new Image()
    img.onload = () => emit('loaded', img, src)
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
