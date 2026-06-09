<template>
  <aside class="flex w-56 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface-2)]">
    <div class="flex-1 overflow-y-auto">

      <!-- Snips section -->
      <div class="border-b border-[var(--color-border)]">
        <button
          class="flex w-full items-center gap-1.5 px-3 py-2.5 text-left transition hover:bg-white/5"
          @click="snipsOpen = !snipsOpen"
        >
          <ChevronDown
            class="size-3 shrink-0 text-[var(--color-text-muted)] transition-transform"
            :class="snipsOpen ? '' : '-rotate-90'"
          />
          <span class="text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-muted)]">Snips</span>
          <span class="ml-auto inline-flex items-center justify-center rounded bg-white/10 px-1.5 py-0.5 text-[9px] leading-none text-[var(--color-text-muted)]">{{ allSnips.length }}</span>
        </button>

        <template v-if="snipsOpen">
          <!-- Grouped by source -->
          <template v-if="sources.length > 1">
            <div v-for="source in sources" :key="source.id">
              <button
                class="flex w-full items-center gap-1.5 px-3 py-1.5 text-left transition hover:bg-white/5"
                @click="toggleGroup(source.id)"
              >
                <ChevronDown
                  class="size-3 shrink-0 text-[var(--color-text-muted)] transition-transform"
                  :class="collapsedGroups.has(source.id) ? '-rotate-90' : ''"
                />
                <span
                  class="truncate text-[10px] font-medium uppercase tracking-wider transition-colors"
                  :class="source.id === activeSourceId ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'"
                >
                  {{ source.label }}
                </span>
                <span class="ml-auto inline-flex shrink-0 items-center justify-center rounded bg-white/10 px-1 py-0.5 text-[9px] leading-none text-[var(--color-text-muted)]">
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
                  <div class="min-w-0">
                    <p class="truncate text-sm font-medium">{{ snip.label }}</p>
                    <p class="font-mono text-[10px] text-[var(--color-text-muted)]">{{ snip.width }}×{{ snip.height }}</p>
                  </div>
                  <div class="flex flex-1 items-center px-2">
                    <span v-if="snip.snapFrame === 'laptop'" class="rounded bg-sky-500/20 px-1 py-px text-[9px] font-medium text-sky-400">Desktop</span>
                    <span v-else-if="snip.snapFrame === 'tablet'" class="rounded bg-teal-500/20 px-1 py-px text-[9px] font-medium text-teal-400">Tablet</span>
                    <span v-else-if="snip.snapFrame === 'phone'" class="rounded bg-violet-500/20 px-1 py-px text-[9px] font-medium text-violet-400">Mobile</span>
                  </div>
                  <button
                    class="ml-auto shrink-0 rounded p-0.5 opacity-0 transition group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-400"
                    title="Delete snip"
                    aria-label="Delete snip"
                    @click.stop="confirmDelete(snip.id)"
                  >
                    <X class="size-3.5" aria-hidden="true" />
                  </button>
                </div>
                <div v-if="snipsBySource(source.id).length === 0" class="py-2 pl-8 text-[10px] text-[var(--color-text-muted)]">
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
              <div class="min-w-0">
                <p class="truncate text-sm font-medium">{{ snip.label }}</p>
                <p class="font-mono text-[10px] text-[var(--color-text-muted)]">{{ snip.width }}×{{ snip.height }}</p>
              </div>
              <div class="flex flex-1 items-center px-2">
                <span v-if="snip.snapFrame === 'laptop'" class="rounded bg-sky-500/20 px-1 py-px text-[9px] font-medium text-sky-400">Desktop</span>
                <span v-else-if="snip.snapFrame === 'tablet'" class="rounded bg-teal-500/20 px-1 py-px text-[9px] font-medium text-teal-400">Tablet</span>
                <span v-else-if="snip.snapFrame === 'phone'" class="rounded bg-violet-500/20 px-1 py-px text-[9px] font-medium text-violet-400">Mobile</span>
              </div>
              <button
                class="ml-auto shrink-0 rounded p-0.5 opacity-0 transition group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-400"
                title="Delete snip"
                @click.stop="confirmDelete(snip.id)"
              >
                <X class="size-3.5" />
              </button>
            </div>
            <div v-if="allSnips.length === 0" class="px-3 py-4 text-center text-sm text-[var(--color-text-muted)]">
              Draw on the screenshot to create snips
            </div>
          </template>
        </template>
      </div>

      <!-- Compositions section -->
      <div>
        <div class="flex w-full items-center gap-1.5 px-3 py-2.5 transition hover:bg-white/5">
          <button
            class="flex flex-1 items-center gap-1.5 text-left"
            @click="compositionsOpen = !compositionsOpen"
          >
            <ChevronDown
              class="size-3 shrink-0 text-[var(--color-text-muted)] transition-transform"
              :class="compositionsOpen ? '' : '-rotate-90'"
            />
            <span class="text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-muted)]">Compositions</span>
            <span class="inline-flex items-center justify-center rounded bg-white/10 px-1.5 py-0.5 text-[9px] leading-none text-[var(--color-text-muted)]">{{ compositions.length }}</span>
          </button>
          <button
            class="ml-auto flex items-center gap-0.5 rounded-[4px] bg-[var(--color-accent)] px-1.5 py-0.5 text-[10px] font-medium transition hover:bg-[var(--color-accent-hover)] hover:text-[var(--color-text)]"
            class="text-[var(--color-on-accent)]"
            title="New composition"
            @click.stop="showNewComp = true"
          >
            <Plus class="size-2.5" />
            New
          </button>
        </div>

        <template v-if="compositionsOpen">
          <div v-for="comp in compositions" :key="comp.id" class="group border-b border-[var(--color-border)]/50">
            <NuxtLink
              :to="`/project/${projectId}/compose/${comp.id}`"
              class="flex items-center gap-2.5 px-3 py-2.5 transition-colors hover:bg-white/5"
              :class="$route.params.compositionId === comp.id ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]' : 'text-[var(--color-text)]'"
            >
              <div class="h-[32px] w-[52px] shrink-0 overflow-hidden rounded border border-[var(--color-border)]">
                <CompositionPreview :composition="comp" class="h-full w-full" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium leading-tight">{{ comp.name }}</p>
                <p class="mt-0.5 font-mono text-[10px] text-[var(--color-text-muted)]">
                  {{ comp.config.outputWidth }}×{{ comp.config.outputHeight }} · {{ comp.type }}
                </p>
              </div>
            </NuxtLink>
          </div>

          <div v-if="compositions.length === 0" class="px-4 py-6 text-center text-sm text-[var(--color-text-muted)]">
            <p class="mb-1">No compositions yet.</p>
            <p class="text-[10px]">Click <strong>New</strong> to create one.</p>
          </div>
        </template>
      </div>

    </div>

    <!-- New composition modal -->
    <NewCompositionModal :open="showNewComp" @close="showNewComp = false" />
  </aside>
</template>

<script setup lang="ts">
import { ChevronDown, X, Plus } from 'lucide-vue-next'
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

const snipsOpen = ref(true)
const compositionsOpen = ref(true)
const showNewComp = ref(false)
const collapsedGroups = ref<Set<string>>(new Set())

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
