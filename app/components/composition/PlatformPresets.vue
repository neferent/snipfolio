<template>
  <!-- Accordion header -->
  <div>
    <button
      class="flex w-full items-center justify-between py-1 transition"
      @click="open = !open"
    >
      <label class="cursor-pointer text-[12px] font-medium tracking-wider uppercase text-[var(--color-text-faint)]">
        Platform presets
        <span v-if="!isPro" class="ml-[5px] rounded-[4px] bg-[var(--color-accent-dim)] px-[5px] py-[1px] align-middle text-[9px] tracking-[0.06em] text-[var(--color-accent)] [border:0.5px_solid_rgba(142,158,173,0.25)]">PRO</span>
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
            ? 'border:1.5px solid #8e9ead;background:rgba(142,158,173,0.08);color:#e2e6ea;font-weight:500'
            : 'border:0.5px solid rgba(255,255,255,0.06);background:transparent;color:#6b7280'"
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
            ? 'border:1.5px solid #8e9ead;background:rgba(142,158,173,0.08);color:#e2e6ea;font-weight:500'
            : 'border:0.5px solid rgba(255,255,255,0.06);background:transparent;color:#6b7280'"
          @click="onSelect(size)"
        >
          <Lock v-if="!isPro" class="size-2.5 shrink-0 opacity-50" />
          {{ size.label }}
          <span class="font-mono text-[10px] opacity-40">{{ size.w }}×{{ size.h }}</span>
        </button>
      </div>

      <!-- Pro upsell (non-pro users) -->
      <div
        v-if="!isPro"
        class="rounded-lg px-3 py-2.5 bg-[var(--color-surface-3)] [border:0.5px_solid_rgba(142,158,173,0.2)]"
      >
        <p class="mb-2 text-xs text-[var(--color-text-muted)]">
          Platform presets are a Pro feature.
        </p>
        <button
          class="flex h-7 w-full items-center justify-center rounded-md text-xs font-medium transition bg-[var(--color-accent-dim)] text-[var(--color-accent)] [border:0.5px_solid_rgba(142,158,173,0.3)]"
          :disabled="checkoutLoading"
          @click="startCheckout('pro')"
        >
          Upgrade to Pro
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChevronDown, Lock } from 'lucide-vue-next'
import { PLATFORM_PRESETS, type SizePreset } from '~/utils/platformPresets'
import { usePlan } from '~/composables/usePlan'
import { useCheckout } from '~/composables/useCheckout'

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

const { isPro } = usePlan()
const { startCheckout, loading: checkoutLoading } = useCheckout()

const selectedPlatform = computed(() =>
  PLATFORM_PRESETS.find((p) => p.id === selectedPlatformId.value) ?? null,
)

function isActive(size: SizePreset) {
  return props.currentW === size.w && props.currentH === size.h
}

function onSelect(size: SizePreset) {
  if (!isPro.value) return
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
