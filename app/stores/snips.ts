import { defineStore } from 'pinia'
import type { Snip } from '~/types'

export const useSnipsStore = defineStore('snips', () => {
  const snips = ref<Snip[]>([])
  const selectedSnipId = ref<string | null>(null)
  const isDrawing = ref(false)

  const selectedSnip = computed(() =>
    snips.value.find((s) => s.id === selectedSnipId.value) ?? null,
  )

  const orderedSnips = computed(() =>
    [...snips.value].sort((a, b) => a.sortOrder - b.sortOrder),
  )

  function setSnips(list: Snip[]) {
    snips.value = list
  }

  function addSnip(snip: Snip) {
    snips.value.push(snip)
  }

  function updateSnip(id: string, patch: Partial<Snip>) {
    const idx = snips.value.findIndex((s) => s.id === id)
    if (idx !== -1) {
      snips.value[idx] = { ...snips.value[idx]!, ...patch } as Snip
    }
  }

  function removeSnip(id: string) {
    snips.value = snips.value.filter((s) => s.id !== id)
    if (selectedSnipId.value === id) selectedSnipId.value = null
  }

  function selectSnip(id: string | null) {
    selectedSnipId.value = id
  }

  function setDrawing(v: boolean) {
    isDrawing.value = v
  }

  function nextLabel() {
    const count = snips.value.length + 1
    return `Snip ${count}`
  }

  return {
    snips,
    selectedSnipId,
    isDrawing,
    selectedSnip,
    orderedSnips,
    setSnips,
    addSnip,
    updateSnip,
    removeSnip,
    selectSnip,
    setDrawing,
    nextLabel,
  }
})
