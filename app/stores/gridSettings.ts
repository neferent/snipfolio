import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'

export const useGridSettingsStore = defineStore('gridSettings', () => {
  const showGrid = useLocalStorage('snipfolio-grid-show', false)
  const snapEnabled = useLocalStorage('snipfolio-grid-snap', false)
  const gridSize = useLocalStorage('snipfolio-grid-size', 20)
  const snapToObjects = useLocalStorage('snipfolio-snap-objects', false)

  return { showGrid, snapEnabled, gridSize, snapToObjects }
})
