<template>
  <div v-if="isGuest" class="flex flex-col items-center gap-2">
    <button
      class="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs transition"
      :class="hidden
        ? 'bg-amber-500/15 text-amber-400 hover:bg-amber-500/20'
        : 'bg-white/5 text-[var(--color-text-muted)] hover:bg-white/8 hover:text-[var(--color-text)]'"
      @click="toggle"
    >
      <component :is="hidden ? Eye : EyeOff" class="size-3" />
      {{ hidden ? 'Show watermark' : 'Hide watermark preview' }}
    </button>

    <div
      v-if="hidden"
      class="max-w-[300px] rounded-xl border-strong bg-[var(--color-surface-2)] px-4 py-3 text-center text-xs"
    >
      <p class="text-[var(--color-text)]">Your export will still include a watermark.</p>
      <p class="mt-0.5 text-[var(--color-text-muted)]">Remove it permanently:</p>
      <div class="mt-3 flex justify-center gap-2">
        <button
          class="flex h-7 items-center rounded-[6px] bg-[var(--color-accent)] px-3 text-xs font-medium text-[var(--color-on-accent)] transition hover:bg-[var(--color-accent-hover)]"
        >
          Subscribe
        </button>
        <button
          class="flex h-7 items-center rounded-[6px] border-strong px-3 text-xs text-[var(--color-text-muted)] transition hover:bg-white/5 hover:text-[var(--color-text)]"
        >
          Pay per export
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Eye, EyeOff } from 'lucide-vue-next'
import { useAuthStore } from '~/stores/auth'
import { useWatermarkPreview } from '~/composables/useWatermarkPreview'

const authStore = useAuthStore()
const { hidden, toggle } = useWatermarkPreview()
const isGuest = computed(() => authStore.isGuest)
</script>
