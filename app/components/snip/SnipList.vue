<template>
  <aside class="flex w-56 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface-2)]">
    <!-- Snips section -->
    <div class="flex items-center justify-between px-3 py-2.5">
      <span class="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
        Snips
      </span>
      <span class="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-[var(--color-text-muted)]">
        {{ snips.length }}
      </span>
    </div>

    <div class="flex-1 overflow-y-auto">
      <div
        v-for="snip in snips"
        :key="snip.id"
        class="group flex cursor-pointer items-center gap-2.5 px-3 py-2 transition-colors"
        :class="
          snip.id === selectedId
            ? 'bg-[var(--color-accent)]/15 text-[var(--color-text)]'
            : 'text-[var(--color-text-muted)] hover:bg-white/5 hover:text-[var(--color-text)]'
        "
        @click="store.selectSnip(snip.id)"
      >
        <!-- Thumbnail -->
        <SnipThumbnail :snip="snip" class="size-9 shrink-0 rounded" />

        <div class="min-w-0 flex-1">
          <p class="truncate text-xs font-medium">{{ snip.label }}</p>
          <p class="text-[10px] text-[var(--color-text-muted)]">
            {{ snip.width }}×{{ snip.height }}
          </p>
        </div>

        <!-- Delete button -->
        <button
          class="ml-auto shrink-0 rounded p-0.5 opacity-0 transition group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-400"
          title="Delete snip"
          @click.stop="confirmDelete(snip.id)"
        >
          <svg class="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div
        v-if="snips.length === 0"
        class="px-3 py-4 text-center text-xs text-[var(--color-text-muted)]"
      >
        Draw on the screenshot to create snips
      </div>
    </div>

    <!-- Compositions section -->
    <div class="border-t border-[var(--color-border)]">
      <div class="flex items-center justify-between px-3 py-2.5">
        <span class="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          Compositions
        </span>
        <button
          class="rounded p-0.5 text-[var(--color-text-muted)] transition hover:bg-white/10 hover:text-[var(--color-text)]"
          title="New composition"
          @click="showNewComp = true"
        >
          <svg class="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      <div class="max-h-48 overflow-y-auto">
        <NuxtLink
          v-for="comp in compositions"
          :key="comp.id"
          :to="`/project/${projectId}/compose/${comp.id}`"
          class="flex items-center gap-2 px-3 py-2 text-xs transition-colors hover:bg-white/5"
          :class="$route.params.compositionId === comp.id ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'"
        >
          <svg class="size-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
          </svg>
          <span class="truncate">{{ comp.name }}</span>
          <span class="ml-auto shrink-0 rounded px-1 py-0.5 text-[9px] uppercase bg-white/5">
            {{ comp.type }}
          </span>
        </NuxtLink>

        <div
          v-if="compositions.length === 0"
          class="px-3 py-3 text-center text-[10px] text-[var(--color-text-muted)]"
        >
          No compositions yet
        </div>
      </div>
    </div>

    <!-- New composition modal -->
    <NewCompositionModal :open="showNewComp" @close="showNewComp = false" />
  </aside>
</template>

<script setup lang="ts">
import { useSnipsStore } from '~/stores/snips'
import { useCompositionsStore } from '~/stores/compositions'

const store = useSnipsStore()
const compositionsStore = useCompositionsStore()
const route = useRoute()

const projectId = computed(() => route.params.id as string)
const snips = computed(() => store.orderedSnips)
const selectedId = computed(() => store.selectedSnipId)
const compositions = computed(() => compositionsStore.ordered)

const showNewComp = ref(false)

const { deleteSnip } = useSnips()

function confirmDelete(id: string) {
  deleteSnip(id)
}
</script>
