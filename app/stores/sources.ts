import { defineStore } from 'pinia'
import type { SourceImage } from '~/types'

export const useSourcesStore = defineStore('sources', () => {
  const sources = ref<SourceImage[]>([])
  const activeSourceId = ref<string | null>(null)
  const loadedImages = ref<Map<string, { img: HTMLImageElement; src: string }>>(new Map())

  const activeSource = computed(() =>
    sources.value.find((s) => s.id === activeSourceId.value) ?? null,
  )

  const activeImage = computed(() => {
    if (!activeSourceId.value) return null
    return loadedImages.value.get(activeSourceId.value) ?? null
  })

  const orderedSources = computed(() =>
    [...sources.value].sort((a, b) => a.sortOrder - b.sortOrder),
  )

  function setSources(list: SourceImage[]) {
    sources.value = list
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
  }

  function getImage(id: string): { img: HTMLImageElement; src: string } | undefined {
    return loadedImages.value.get(id)
  }

  return {
    sources,
    activeSourceId,
    loadedImages,
    activeSource,
    activeImage,
    orderedSources,
    setSources,
    addSource,
    updateSource,
    removeSource,
    setActiveSource,
    setLoadedImage,
    getImage,
  }
})
