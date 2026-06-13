import { defineStore } from 'pinia'
import type { SourceImage } from '~/types'

export const useSourcesStore = defineStore('sources', () => {
  const sources = ref<SourceImage[]>([])
  const activeSourceId = ref<string | null>(null)
  const loadedImages = ref<Map<string, { img: HTMLImageElement; src: string }>>(new Map())
  const loadingSourceIds = ref<Set<string>>(new Set())
  const failedSourceIds = ref<Set<string>>(new Set())

  const activeSource = computed(() =>
    sources.value.find((s) => s.id === activeSourceId.value) ?? null,
  )

  const activeImage = computed(() => {
    if (!activeSourceId.value) return null
    return loadedImages.value.get(activeSourceId.value) ?? null
  })

  const isActiveSourceLoading = computed(() =>
    activeSourceId.value !== null && loadingSourceIds.value.has(activeSourceId.value),
  )

  const orderedSources = computed(() =>
    [...sources.value].sort((a, b) => a.sortOrder - b.sortOrder),
  )

  function setSources(list: SourceImage[]) {
    sources.value = list
    loadedImages.value = new Map()
    loadingSourceIds.value = new Set()
    failedSourceIds.value = new Set()
  }

  function markSourceLoading(id: string) {
    loadingSourceIds.value = new Set([...loadingSourceIds.value, id])
  }

  function markSourceLoaded(id: string) {
    const next = new Set(loadingSourceIds.value)
    next.delete(id)
    loadingSourceIds.value = next
  }

  function markSourceFailed(id: string) {
    failedSourceIds.value = new Set([...failedSourceIds.value, id])
  }

  function addSource(source: SourceImage) {
    sources.value.push(source)
  }

  function updateSource(id: string, patch: Partial<SourceImage>) {
    const idx = sources.value.findIndex((s) => s.id === id)
    if (idx !== -1) {
      sources.value[idx] = { ...sources.value[idx]!, ...patch } as SourceImage
    }
  }

  function removeSource(id: string) {
    sources.value = sources.value.filter((s) => s.id !== id)
    loadedImages.value.delete(id)
    if (failedSourceIds.value.has(id)) {
      const next = new Set(failedSourceIds.value)
      next.delete(id)
      failedSourceIds.value = next
    }
    if (activeSourceId.value === id) {
      activeSourceId.value = sources.value[0]?.id ?? null
    }
  }

  function setActiveSource(id: string | null) {
    activeSourceId.value = id
  }

  function setLoadedImage(id: string, img: HTMLImageElement, src: string) {
    const map = new Map(loadedImages.value)
    map.set(id, { img, src })
    loadedImages.value = map
    if (failedSourceIds.value.has(id)) {
      const next = new Set(failedSourceIds.value)
      next.delete(id)
      failedSourceIds.value = next
    }
  }

  function getImage(id: string): { img: HTMLImageElement; src: string } | undefined {
    return loadedImages.value.get(id)
  }

  const isActiveSourceFailed = computed(() =>
    activeSourceId.value !== null && failedSourceIds.value.has(activeSourceId.value),
  )

  return {
    sources,
    activeSourceId,
    loadedImages,
    loadingSourceIds,
    failedSourceIds,
    activeSource,
    activeImage,
    isActiveSourceLoading,
    isActiveSourceFailed,
    orderedSources,
    setSources,
    addSource,
    updateSource,
    removeSource,
    setActiveSource,
    setLoadedImage,
    markSourceLoading,
    markSourceLoaded,
    markSourceFailed,
    getImage,
  }
})
