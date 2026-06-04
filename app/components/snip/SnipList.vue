<template>
  <aside class="flex w-56 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface-2)]">
    <div class="flex-1 overflow-y-auto">
      <!-- Snips section header -->
      <div class="flex items-center justify-between px-3 py-2.5">
        <span class="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          Snips
        </span>
        <span class="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-[var(--color-text-muted)]">
          {{ allSnips.length }}
        </span>
      </div>
      <!-- Grouped by source -->
      <template v-if="sources.length > 1">
        <div v-for="source in sources" :key="source.id">
          <!-- Source group header -->
          <button
            class="flex w-full items-center gap-1.5 px-3 py-1.5 text-left transition hover:bg-white/5"
            @click="toggleGroup(source.id)"
          >
            <svg
              class="size-3 shrink-0 text-[var(--color-text-muted)] transition-transform"
              :class="collapsedGroups.has(source.id) ? '-rotate-90' : ''"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
            <span
              class="truncate text-[10px] font-semibold uppercase tracking-wider transition-colors"
              :class="source.id === activeSourceId ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'"
            >
              {{ source.label }}
            </span>
            <span class="ml-auto shrink-0 rounded bg-white/10 px-1 py-0.5 text-[9px] text-[var(--color-text-muted)]">
              {{ snipsBySource(source.id).length }}
            </span>
          </button>

          <template v-if="!collapsedGroups.has(source.id)">
            <div
              v-for="snip in snipsBySource(source.id)"
              :key="snip.id"
              class="group flex cursor-pointer items-center gap-2.5 px-3 py-2 transition-colors"
              :class="
                snip.id === selectedId
                  ? 'bg-[var(--color-accent)]/15 text-[var(--color-text)]'
                  : 'text-[var(--color-text-muted)] hover:bg-white/5 hover:text-[var(--color-text)]'
              "
              @click="selectSnip(snip.id, source.id)"
            >
              <SnipThumbnail :snip="snip" class="size-9 shrink-0 rounded" />
              <div class="min-w-0 flex-1">
                <p class="truncate text-xs font-medium">{{ snip.label }}</p>
                <p class="text-[10px] text-[var(--color-text-muted)]">{{ snip.width }}×{{ snip.height }}</p>
              </div>
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
              v-if="snipsBySource(source.id).length === 0"
              class="py-2 pl-8 text-[10px] text-[var(--color-text-muted)]"
            >
              No snips yet
            </div>
          </template>
        </div>
      </template>

      <!-- Single source: flat list -->
      <template v-else>
        <div
          v-for="snip in allSnips"
          :key="snip.id"
          class="group flex cursor-pointer items-center gap-2.5 px-3 py-2 transition-colors"
          :class="
            snip.id === selectedId
              ? 'bg-[var(--color-accent)]/15 text-[var(--color-text)]'
              : 'text-[var(--color-text-muted)] hover:bg-white/5 hover:text-[var(--color-text)]'
          "
          @click="store.selectSnip(snip.id)"
        >
          <SnipThumbnail :snip="snip" class="size-9 shrink-0 rounded" />
          <div class="min-w-0 flex-1">
            <p class="truncate text-xs font-medium">{{ snip.label }}</p>
            <p class="text-[10px] text-[var(--color-text-muted)]">{{ snip.width }}×{{ snip.height }}</p>
          </div>
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
          v-if="allSnips.length === 0"
          class="px-3 py-4 text-center text-xs text-[var(--color-text-muted)]"
        >
          Draw on the screenshot to create snips
        </div>
      </template>

      <!-- Compositions section -->
      <div class="border-t border-[var(--color-border)]">
        <button
          class="flex w-full items-center gap-1.5 px-3 py-2.5 text-left transition hover:bg-white/5"
          @click="compositionsCollapsed = !compositionsCollapsed"
        >
          <svg
            class="size-3 shrink-0 text-[var(--color-text-muted)] transition-transform"
            :class="compositionsCollapsed ? '-rotate-90' : ''"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
          <span class="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            Compositions
          </span>
          <span class="ml-1 rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-[var(--color-text-muted)]">
            {{ compositions.length }}
          </span>
          <button
            class="ml-auto rounded p-0.5 text-[var(--color-text-muted)] transition hover:bg-white/10 hover:text-[var(--color-text)]"
            title="New composition"
            @click.stop="showNewComp = true"
          >
            <svg class="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </button>

        <template v-if="!compositionsCollapsed">
          <div v-for="comp in compositions" :key="comp.id">
            <div class="group flex items-center gap-1 pr-1 text-xs transition-colors hover:bg-white/5"
              :class="$route.params.compositionId === comp.id ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'"
            >
              <button
                class="flex shrink-0 items-center justify-center p-1.5 transition hover:text-[var(--color-text)]"
                :title="expandedComps.has(comp.id) ? 'Hide preview' : 'Show preview'"
                @click="toggleCompExpanded(comp.id)"
              >
                <svg
                  class="size-2.5 transition-transform"
                  :class="expandedComps.has(comp.id) ? '' : '-rotate-90'"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <NuxtLink
                :to="`/project/${projectId}/compose/${comp.id}`"
                class="flex min-w-0 flex-1 items-center gap-2 py-2"
              >
                <svg class="size-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                </svg>
                <span class="truncate">{{ comp.name }}</span>
                <span class="ml-auto shrink-0 rounded px-1 py-0.5 text-[9px] uppercase bg-white/5">
                  {{ comp.type }}
                </span>
              </NuxtLink>
            </div>
            <div v-if="expandedComps.has(comp.id)" class="px-3 pb-3">
              <CompositionPreview :composition="comp" />
            </div>
          </div>

          <div
            v-if="compositions.length === 0"
            class="px-3 py-3 text-center text-[10px] text-[var(--color-text-muted)]"
          >
            No compositions yet
          </div>
        </template>
      </div>
    </div>

    <!-- New composition modal -->
    <NewCompositionModal :open="showNewComp" @close="showNewComp = false" />
  </aside>
</template>

<script setup lang="ts">
import { useSnipsStore } from '~/stores/snips'
import { useCompositionsStore } from '~/stores/compositions'
import { useSourcesStore } from '~/stores/sources'

const store = useSnipsStore()
const compositionsStore = useCompositionsStore()
const sourcesStore = useSourcesStore()
const route = useRoute()

const projectId = computed(() => route.params.id as string)
const allSnips = computed(() => store.orderedSnips)
const selectedId = computed(() => store.selectedSnipId)
const compositions = computed(() => compositionsStore.ordered)
const sources = computed(() => sourcesStore.orderedSources)
const activeSourceId = computed(() => sourcesStore.activeSourceId)

const showNewComp = ref(false)
const collapsedGroups = ref<Set<string>>(new Set())
const compositionsCollapsed = ref(false)
const expandedComps = ref<Set<string>>(new Set())

function toggleCompExpanded(id: string) {
  const next = new Set(expandedComps.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expandedComps.value = next
}

function snipsBySource(sourceId: string) {
  return allSnips.value.filter((s) => s.sourceImageId === sourceId)
}

function toggleGroup(sourceId: string) {
  const next = new Set(collapsedGroups.value)
  if (next.has(sourceId)) next.delete(sourceId)
  else next.add(sourceId)
  collapsedGroups.value = next
}

function selectSnip(snipId: string, sourceId: string) {
  store.selectSnip(snipId)
  sourcesStore.setActiveSource(sourceId)
}

const { deleteSnip } = useSnips()

function confirmDelete(id: string) {
  deleteSnip(id)
}
</script>
