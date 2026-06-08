<template>
  <AppModal :open="open" title="Export compositions" max-width="780px" @close="$emit('close')">
    <div class="flex gap-4" style="min-height: 340px">
      <!-- Left: composition list with checkboxes -->
      <div class="flex w-56 shrink-0 flex-col gap-1">
        <label class="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 transition hover:bg-white/5">
          <input
            type="checkbox"
            class="size-3.5 accent-[var(--color-accent)]"
            :checked="allSelected"
            :indeterminate="someSelected && !allSelected"
            @change="toggleAll"
          />
          <span class="text-xs font-medium text-[var(--color-text-muted)]">
            {{ allSelected ? 'Deselect all' : 'Select all' }}
          </span>
        </label>

        <div class="my-0.5 h-px bg-[var(--color-border)]" />

        <label
          v-for="comp in compositions"
          :key="comp.id"
          class="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 transition hover:bg-white/5"
          :class="previewComp?.id === comp.id ? 'bg-white/5' : ''"
          @mouseenter="previewComp = comp"
        >
          <input
            type="checkbox"
            class="size-3.5 shrink-0 accent-[var(--color-accent)]"
            :checked="selected.has(comp.id)"
            @change="toggleOne(comp.id)"
          />
          <div class="min-w-0 flex-1">
            <p class="truncate text-xs text-[var(--color-text)]">{{ comp.name }}</p>
            <p class="text-[10px] text-[var(--color-text-muted)]">
              {{ comp.config.outputWidth }}×{{ comp.config.outputHeight }} · {{ comp.type }}
            </p>
          </div>
        </label>

        <div v-if="compositions.length === 0" class="px-2 py-4 text-center text-xs text-[var(--color-text-muted)]">
          No compositions yet
        </div>
      </div>

      <!-- Right: preview -->
      <div class="flex min-w-0 flex-1 flex-col rounded-lg bg-[var(--color-surface)] p-3">
        <template v-if="previewComp">
          <p class="mb-2 truncate text-xs font-medium text-[var(--color-text-muted)]">
            {{ previewComp.name }}
          </p>
          <div class="flex flex-1 items-center justify-center overflow-hidden">
            <CompositionPreview :composition="previewComp" class="max-h-full max-w-full rounded object-contain" />
          </div>
          <p class="mt-2 text-center text-[10px] text-[var(--color-text-muted)]">
            {{ previewComp.config.outputWidth }}×{{ previewComp.config.outputHeight }}px
          </p>
        </template>
        <div v-else class="flex flex-1 items-center justify-center">
          <p class="text-xs text-[var(--color-text-muted)]">Hover a composition to preview</p>
        </div>
      </div>
    </div>

    <!-- Frame mismatch warning -->
    <div
      v-if="exportMismatches.length > 0"
      class="mt-4 rounded-lg px-4 py-3"
      style="background:rgba(251,191,36,0.05);border:0.5px solid rgba(251,191,36,0.25)"
    >
      <p style="font-size:11px;font-weight:600;color:#fbbf24;margin-bottom:5px;letter-spacing:0.04em">Frame mismatch</p>
      <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:3px">
        <li
          v-for="m in exportMismatches"
          :key="m.slotId"
          style="font-size:11px;color:rgba(251,191,36,0.7)"
        >
          <span style="color:rgba(251,191,36,0.4)">{{ m.frameName }}</span>
          {{ m.snipLabel }}<span v-if="exportMismatches.length > 1 && m.compName" style="color:rgba(251,191,36,0.35)"> · {{ m.compName }}</span>
        </li>
      </ul>
      <p style="font-size:10px;color:rgba(251,191,36,0.4);margin-top:5px">Frame will appear distorted</p>
    </div>

    <!-- Tier upsell banner -->
    <div v-if="!authStore.isPro" class="mt-4 rounded-lg px-4 py-3" style="background:#1e2228;border:0.5px solid rgba(255,255,255,0.08)">
      <!-- Guest -->
      <template v-if="authStore.isGuest">
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <Droplets class="size-3.5 shrink-0 text-[var(--color-accent)]" />
            <span class="text-xs text-[var(--color-text-muted)]">Exports include a watermark. Sign in for 1-Day Access or Pro.</span>
          </div>
          <NuxtLink
            to="/"
            class="shrink-0 rounded-[5px] px-3 py-1 text-xs font-medium text-[var(--color-text)] transition hover:bg-white/10"
            style="border:0.5px solid rgba(255,255,255,0.14)"
            @click="$emit('close')"
          >
            Sign in
          </NuxtLink>
        </div>
      </template>

      <!-- Account with active day access -->
      <template v-else-if="dayAccessExpiry">
        <div class="flex items-center gap-2">
          <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium" style="background:rgba(74,222,128,0.12);color:#4ade80">
            <span class="size-1.5 rounded-full bg-green-400" />
            1-Day Access active — expires {{ formatExpiry(dayAccessExpiry) }}
          </span>
        </div>
      </template>

      <!-- Account without access -->
      <template v-else>
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <Droplets class="size-3.5 shrink-0 text-[var(--color-accent)]" />
            <span class="text-xs text-[var(--color-text-muted)]">Exports include a watermark.</span>
          </div>
          <div class="flex items-center gap-2">
            <button
              class="rounded-[5px] px-3 py-1 text-xs font-medium transition hover:bg-white/10 disabled:opacity-40"
              style="border:0.5px solid rgba(255,255,255,0.14);color:#e2e6ea"
              :disabled="checkoutLoading"
              @click="onBuyDayAccess"
            >
              1-Day Access — $4.99
            </button>
            <button
              class="rounded-[5px] px-3 py-1 text-xs font-medium transition disabled:opacity-40"
              style="background:rgba(142,158,173,0.15);border:0.5px solid rgba(142,158,173,0.3);color:#8e9ead"
              :disabled="checkoutLoading"
              @click="onGoPro"
            >
              Go Pro
            </button>
          </div>
        </div>
      </template>
    </div>

    <template #footer>
      <button
        class="flex h-8 items-center rounded-[6px] px-4 text-sm text-[var(--color-text-muted)] transition hover:bg-white/5"
        @click="$emit('close')"
      >
        Cancel
      </button>
      <button
        class="flex h-8 items-center rounded-[6px] bg-[var(--color-accent)] px-4 text-sm font-medium transition hover:bg-[var(--color-accent-hover)] hover:text-[var(--color-text)] disabled:opacity-40"
        style="color:#111316"
        :disabled="selected.size === 0"
        @click="exportSelected"
      >
        Export {{ selected.size > 0 ? selected.size : '' }} composition{{ selected.size === 1 ? '' : 's' }}
        <span v-if="!authStore.isPro && !dayAccessExpiry" class="ml-1.5 opacity-60">(watermarked)</span>
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { Droplets } from 'lucide-vue-next'
import { useCompositionsStore } from '~/stores/compositions'
import { useProjectStore } from '~/stores/project'
import { useAuthStore } from '~/stores/auth'
import { usePlan } from '~/composables/usePlan'
import { useExport } from '~/composables/useExport'
import { useCheckout } from '~/composables/useCheckout'
import { useSnipsStore } from '~/stores/snips'
import { getFrameMismatches } from '~/composables/useFrameMismatches'
import type { Composition } from '~/types'

const props = defineProps<{
  open: boolean
  preselectId?: string
}>()
const emit = defineEmits<{ close: [] }>()

const compositionsStore = useCompositionsStore()
const snipsStore = useSnipsStore()
const projectStore = useProjectStore()
const authStore = useAuthStore()
const { getDayAccessExpiry } = usePlan()
const { exportComposition } = useExport()
const { startCheckout, loading: checkoutLoading } = useCheckout()

const compositions = computed(() => compositionsStore.ordered)

const selected = ref<Set<string>>(new Set())
const previewComp = ref<Composition | null>(null)
const dayAccessExpiry = ref<Date | null>(null)

const allSelected = computed(() => compositions.value.length > 0 && selected.value.size === compositions.value.length)

const exportMismatches = computed(() =>
  compositions.value
    .filter((c) => selected.value.has(c.id))
    .flatMap((c) => getFrameMismatches(c, snipsStore.snips).map((m) => ({ ...m, compName: c.name }))),
)
const someSelected = computed(() => selected.value.size > 0)

// Load day access state whenever the modal opens
watch(() => props.open, async (v) => {
  if (!v) return
  const projectId = projectStore.current?.id
  if (projectId && !authStore.isGuest && !authStore.isPro) {
    dayAccessExpiry.value = await getDayAccessExpiry(projectId)
  } else {
    dayAccessExpiry.value = null
  }
}, { immediate: true })

watch(() => compositions.value, (list) => {
  if (!previewComp.value && list.length > 0) previewComp.value = list[0]!
}, { immediate: true })

// Auto-select preselectId when provided
watch([() => props.preselectId, () => compositions.value], ([id, list]) => {
  if (id && list.some((c) => c.id === id)) {
    selected.value = new Set([id])
    previewComp.value = list.find((c) => c.id === id) ?? previewComp.value
  }
}, { immediate: true })

// Prune deleted compositions from selection
watch(() => compositions.value, (list) => {
  const next = new Set<string>()
  for (const id of selected.value) {
    if (list.some((c) => c.id === id)) next.add(id)
  }
  selected.value = next
})

function toggleOne(id: string) {
  const next = new Set(selected.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selected.value = next
}

function toggleAll() {
  if (allSelected.value) {
    selected.value = new Set()
  } else {
    selected.value = new Set(compositions.value.map((c) => c.id))
  }
}

function exportSelected() {
  const watermark = !authStore.isPro && !dayAccessExpiry.value
  const toExport = compositions.value.filter((c) => selected.value.has(c.id))
  toExport.forEach((comp, i) => {
    setTimeout(() => exportComposition(comp, watermark), i * 200)
  })
  emit('close')
}

function onBuyDayAccess() {
  const projectId = projectStore.current?.id
  if (projectId) startCheckout('day_pass', projectId)
}

function onGoPro() {
  startCheckout('pro_early')
}

function formatExpiry(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>
