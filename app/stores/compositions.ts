import { defineStore } from 'pinia'
import type { Composition } from '~/types'

export const useCompositionsStore = defineStore('compositions', () => {
  const compositions = ref<Composition[]>([])
  const selectedId = ref<string | null>(null)

  const selected = computed(() =>
    compositions.value.find((c) => c.id === selectedId.value) ?? null,
  )

  const ordered = computed(() =>
    [...compositions.value].sort((a, b) => a.sortOrder - b.sortOrder),
  )

  function setCompositions(list: Composition[]) {
    compositions.value = list
  }

  function addComposition(comp: Composition) {
    compositions.value.push(comp)
  }

  function updateComposition(id: string, patch: Partial<Composition>) {
    const idx = compositions.value.findIndex((c) => c.id === id)
    if (idx !== -1) {
      compositions.value[idx] = { ...compositions.value[idx]!, ...patch } as Composition
    }
  }

  function removeComposition(id: string) {
    compositions.value = compositions.value.filter((c) => c.id !== id)
    if (selectedId.value === id) selectedId.value = null
  }

  function selectComposition(id: string | null) {
    selectedId.value = id
  }

  return {
    compositions,
    selectedId,
    selected,
    ordered,
    setCompositions,
    addComposition,
    updateComposition,
    removeComposition,
    selectComposition,
  }
})
