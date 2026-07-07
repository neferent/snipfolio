<template>
  <!-- Accordion header -->
  <div>
    <button
      class="flex w-full items-center justify-between py-1 transition"
      @click="open = !open"
    >
      <label class="cursor-pointer text-[12px] font-medium tracking-wider uppercase text-[var(--color-text-faint)]">
        Platform presets
      </label>
      <ChevronDown
        class="size-3.5 shrink-0 transition-transform text-[var(--color-text-faint)]"
        :style="open ? 'transform:rotate(180deg)' : ''"
      />
    </button>

    <div v-if="open" class="mt-2 space-y-3">
      <!-- Platform tabs -->
      <div class="flex gap-1 flex-wrap">
        <button
          v-for="platform in PLATFORM_PRESETS"
          :key="platform.id"
          class="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition"
          :style="selectedPlatformId === platform.id
            ? 'border:1.5px solid var(--color-accent);background:rgba(142,158,173,0.08);color:var(--color-text);font-weight:500'
            : 'border:0.5px solid var(--color-border);background:transparent;color:var(--color-text-muted)'"
          @click="selectedPlatformId = platform.id"
        >
          <component :is="logoFor(platform.id)" class="size-3 shrink-0" />
          {{ platform.name }}
        </button>
      </div>

      <!-- Size chips -->
      <div v-if="selectedPlatform" class="flex flex-wrap gap-1.5">
        <button
          v-for="size in selectedPlatform.sizes"
          :key="size.label"
          class="relative flex h-[28px] items-center gap-1.5 rounded-md px-2.5 text-xs transition"
          :style="isActive(size)
            ? 'border:1.5px solid var(--color-accent);background:rgba(142,158,173,0.08);color:var(--color-text);font-weight:500'
            : 'border:0.5px solid var(--color-border);background:transparent;color:var(--color-text-muted)'"
          @click="onSelect(size)"
        >
          {{ size.label }}
          <span class="font-mono text-[10px] opacity-40">{{ size.w }}×{{ size.h }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next'
import { PLATFORM_PRESETS, type SizePreset } from '~/utils/platformPresets'

// Platform logo components (inline SVG via render functions)
import LogoAppStore from '~/components/icons/LogoAppStore.vue'
import LogoGooglePlay from '~/components/icons/LogoGooglePlay.vue'
import LogoSteam from '~/components/icons/LogoSteam.vue'
import LogoProductHunt from '~/components/icons/LogoProductHunt.vue'

const emit = defineEmits<{
  'select': [w: number, h: number]
}>()

const props = defineProps<{
  currentW: number
  currentH: number
}>()

const open = ref(false)
const selectedPlatformId = ref(PLATFORM_PRESETS[0]!.id)

const selectedPlatform = computed(() =>
  PLATFORM_PRESETS.find((p) => p.id === selectedPlatformId.value) ?? null,
)

function isActive(size: SizePreset) {
  return props.currentW === size.w && props.currentH === size.h
}

function onSelect(size: SizePreset) {
  emit('select', size.w, size.h)
}

function logoFor(id: string) {
  if (id === 'appstore') return LogoAppStore
  if (id === 'googleplay') return LogoGooglePlay
  if (id === 'steam') return LogoSteam
  if (id === 'producthunt') return LogoProductHunt
  return null
}
</script>
