import { useCompositionsStore } from '~/stores/compositions'
import { useProjectStore } from '~/stores/project'
import { useSnipsStore } from '~/stores/snips'
import type {
  Composition,
  CompositionType,
  SingleCompositionConfig,
  CollageCompositionConfig,
  BackgroundConfig,
} from '~/types'

const DEFAULT_BACKGROUND = {
  type: 'solid' as const,
  color: '#1a1a2e',
  gradientStart: '#1a1a2e',
  gradientEnd: '#16213e',
  gradientAngle: 135,
}

export function useCompositions() {
  const store = useCompositionsStore()
  const projectStore = useProjectStore()
  const snipsStore = useSnipsStore()
  const { scheduleSave } = useProject()

  function createSingleComposition(snipId: string, name?: string, backgroundOverride?: Partial<BackgroundConfig>): Composition {
    const snip = snipsStore.snips.find((s) => s.id === snipId)
    const config: SingleCompositionConfig = {
      snipId,
      deviceFrame: snip?.deviceFrame ?? 'none',
      background: { ...DEFAULT_BACKGROUND, ...backgroundOverride },
      scale: 0.8,
      offsetX: 0,
      offsetY: 0,
      outputWidth: 1920,
      outputHeight: 1080,
    }
    const comp: Composition = {
      id: crypto.randomUUID(),
      projectId: projectStore.current!.id,
      name: name ?? `Composition ${store.compositions.length + 1}`,
      type: 'single',
      config,
      sortOrder: store.compositions.length,
    }
    store.addComposition(comp)
    scheduleSave()
    return comp
  }

  function createCollageComposition(snipIds: string[], name?: string, backgroundOverride?: Partial<BackgroundConfig>): Composition {
    const config: CollageCompositionConfig = {
      slots: snipIds.map((snipId) => {
        const snip = snipsStore.snips.find((s) => s.id === snipId)
        return { snipId, deviceFrame: snip?.deviceFrame ?? 'none' }
      }),
      template: 'auto',
      gap: 24,
      background: { ...DEFAULT_BACKGROUND, ...backgroundOverride },
      outputWidth: 1920,
      outputHeight: 1080,
    }
    const comp: Composition = {
      id: crypto.randomUUID(),
      projectId: projectStore.current!.id,
      name: name ?? `Auto-Collage ${store.compositions.length + 1}`,
      type: 'collage',
      config,
      sortOrder: store.compositions.length,
    }
    store.addComposition(comp)
    scheduleSave()
    return comp
  }

  function updateComposition(id: string, patch: Partial<Composition>) {
    store.updateComposition(id, patch)
    scheduleSave()
  }

  function deleteComposition(id: string) {
    store.removeComposition(id)
    scheduleSave()
  }

  return { createSingleComposition, createCollageComposition, updateComposition, deleteComposition }
}
