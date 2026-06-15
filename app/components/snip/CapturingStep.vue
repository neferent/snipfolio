<template>
  <div class="space-y-1">
    <p class="text-xs text-[var(--color-text-muted)]">
      {{ captureError ? 'Capture failed' : captureStatusLabel }}
    </p>
    <div v-if="!captureError" class="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/5">
      <div
        class="h-full rounded-full bg-[var(--color-accent)] transition-[width] duration-1000 ease-linear"
        :style="{ width: overallProgressPercent(activeViewports.map((v) => captureState[v].progress), tickNow) + '%' }"
      />
    </div>
    <div class="flex items-end gap-2 pt-2">
      <div
        v-for="viewport in activeViewports"
        :key="viewport"
        class="flex flex-col overflow-hidden rounded border border-white/10"
        :style="{ width: pillWidth(viewport) + 'px' }"
      >
        <div class="relative flex items-center justify-center bg-black/20" style="height: 140px;">
          <Loader2Icon v-if="captureState[viewport].status === 'loading'" class="size-4 animate-spin text-white/30" />
          <img
            v-else-if="captureState[viewport].status === 'done' && captureState[viewport].src"
            :src="captureState[viewport].src"
            class="absolute inset-0 block w-full object-cover object-top"
            draggable="false"
          />
          <XIcon v-else-if="captureState[viewport].status === 'error'" class="size-4 text-red-400" />
        </div>
        <div class="flex items-center gap-1 border-t border-white/10 px-1.5 py-1">
          <CheckIcon v-if="captureState[viewport].status === 'done'" class="size-3 shrink-0 text-emerald-400" />
          <Loader2Icon v-else-if="captureState[viewport].status === 'loading'" class="size-3 shrink-0 animate-spin text-white/30" />
          <XIcon v-else-if="captureState[viewport].status === 'error'" class="size-3 shrink-0 text-red-400" />
          <span class="truncate text-[10px] text-[var(--color-text-muted)]">{{ VIEWPORT_LABEL[viewport] }}</span>
        </div>
      </div>
    </div>
    <div v-if="!captureError" class="pt-2 text-center">
      <button
        type="button"
        class="text-xs text-[var(--color-text-muted)] transition hover:text-[var(--color-text)]"
        @click="$emit('cancel')"
      >
        Cancel
      </button>
    </div>
    <p v-if="captureError" class="pt-1 text-xs text-red-400">{{ captureError }}</p>
  </div>
</template>

<script setup lang="ts">
import { Loader2Icon, CheckIcon, XIcon } from 'lucide-vue-next'
import { overallProgressPercent, viewportPhaseLabel, VIEWPORT_LABEL } from '~/composables/useUrlCapture'
import type { CaptureViewport, ViewportProgress } from '~/composables/useUrlCapture'
import type { CaptureStatus } from '~/composables/useUrlCaptureFlow'

const props = defineProps<{
  activeViewports: CaptureViewport[]
  captureState: Record<CaptureViewport, { status: CaptureStatus; src: string; progress: ViewportProgress }>
  captureError: string
  tickNow: number
}>()
defineEmits<{ cancel: [] }>()

/** Status label for the capturing step: shows which viewport is in flight and its current phase. */
const captureStatusLabel = computed(() => {
  const loading = props.activeViewports.find((v) => props.captureState[v].status === 'loading')
  if (loading) return `${VIEWPORT_LABEL[loading]}: ${viewportPhaseLabel(props.captureState[loading].progress.phase)}`
  if (props.activeViewports.length > 0 && props.activeViewports.every((v) => props.captureState[v].status === 'done')) return 'Finishing up…'
  return 'Preparing…'
})

/** Pill width for a capture-progress preview, sized proportionally to the active viewport mix. */
function pillWidth(viewport: CaptureViewport): number {
  const n = props.activeViewports.length
  if (n === 1) return 320
  if (n === 2) return viewport === 'mobile' ? 65 : 240
  if (viewport === 'desktop') return 170
  if (viewport === 'tablet') return 130
  return 55
}
</script>
