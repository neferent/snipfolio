import { useCompositionsStore } from '~/stores/compositions'
import { useProjectStore } from '~/stores/project'
import { useSnipsStore } from '~/stores/snips'
import type {
  Composition,
  CompositionType,
  FreeformCompositionConfig,
  FreeformSlotConfig,
  CollageCompositionConfig,
  BackgroundConfig,
  DeviceFrame,
} from '~/types'

// SVG total-bounding-box aspect ratios for each frame type.
// Used to compute initial slot dimensions so the frame looks natural.
const FRAME_ASPECT: Record<DeviceFrame, number | null> = {
  laptop: 3809.99 / 2300,
  phone: 772.5 / 1600,
  tablet: 820 / 1120,
  browser: null, // computed from snip aspect (toolbar is thin)
  none: null,    // use snip aspect
}

const DEFAULT_BACKGROUND: BackgroundConfig = {
  type: 'solid',
  color: '#1a1a2e',
  gradientStart: '#1a1a2e',
  gradientEnd: '#16213e',
  gradientAngle: 135,
}

/** Compute initial slot dimensions that make a snip look natural inside a given frame. */
function defaultSlotDimensions(
  snipW: number,
  snipH: number,
  frame: DeviceFrame,
  outputW: number,
  outputH: number,
): { w: number; h: number } {
  const frameAspect = FRAME_ASPECT[frame]
  const totalAspect = frameAspect ?? snipW / snipH
  const targetH = outputH * 0.68
  const targetW = targetH * totalAspect
  if (targetW > outputW * 0.85) {
    return { w: outputW * 0.85, h: (outputW * 0.85) / totalAspect }
  }
  return { w: targetW, h: targetH }
}

function makeSlot(
  snipId: string,
  snipW: number,
  snipH: number,
  frame: DeviceFrame,
  x: number,
  y: number,
  outputW: number,
  outputH: number,
): FreeformSlotConfig {
  const { w, h } = defaultSlotDimensions(snipW, snipH, frame, outputW, outputH)
  return {
    id: crypto.randomUUID(),
    snipId,
    deviceFrame: frame,
    x: Math.round(x - w / 2),
    y: Math.round(y - h / 2),
    width: Math.round(w),
    height: Math.round(h),
  }
}

export function useCompositions() {
  const store = useCompositionsStore()
  const projectStore = useProjectStore()
  const snipsStore = useSnipsStore()
  const { scheduleSave } = useProject()

  const outputW = 1920
  const outputH = 1080

  function _makeComposition(
    name: string,
    type: CompositionType,
    config: FreeformCompositionConfig | CollageCompositionConfig,
  ): Composition {
    const comp: Composition = {
      id: crypto.randomUUID(),
      projectId: projectStore.current!.id,
      name: name || `${type} ${store.compositions.length + 1}`,
      type,
      config,
      sortOrder: store.compositions.length,
    }
    store.addComposition(comp)
    scheduleSave()
    return comp
  }

  function createLaptopComposition(
    snipId: string,
    name?: string,
    bg?: Partial<BackgroundConfig>,
  ): Composition {
    const snip = snipsStore.snips.find((s) => s.id === snipId)
    const slot = makeSlot(snipId, snip?.width ?? 1920, snip?.height ?? 1080, 'laptop', outputW / 2, outputH / 2, outputW, outputH)
    const config: FreeformCompositionConfig = {
      slots: [slot],
      background: { ...DEFAULT_BACKGROUND, ...bg },
      outputWidth: outputW,
      outputHeight: outputH,
    }
    return _makeComposition(name ?? 'Desktop', 'laptop', config)
  }

  function createLaptopPhoneComposition(
    laptopSnipId: string,
    phoneSnipId: string,
    name?: string,
    bg?: Partial<BackgroundConfig>,
  ): Composition {
    const laptopSnip = snipsStore.snips.find((s) => s.id === laptopSnipId)
    const phoneSnip = snipsStore.snips.find((s) => s.id === phoneSnipId)
    // Laptop: left-center at 38% from left
    const laptopSlot = makeSlot(laptopSnipId, laptopSnip?.width ?? 1920, laptopSnip?.height ?? 1080, 'laptop', outputW * 0.38, outputH / 2, outputW, outputH)
    // Phone: right-center at 72% from left; phone is taller so 75% of outputH
    const phoneH = outputH * 0.78
    const phoneAspect = FRAME_ASPECT.phone!
    const phoneW = phoneH * phoneAspect
    const phoneSlot: FreeformSlotConfig = {
      id: crypto.randomUUID(),
      snipId: phoneSnipId,
      deviceFrame: 'phone',
      x: Math.round(outputW * 0.72 - phoneW / 2),
      y: Math.round(outputH / 2 - phoneH / 2),
      width: Math.round(phoneW),
      height: Math.round(phoneH),
    }
    const config: FreeformCompositionConfig = {
      slots: [laptopSlot, phoneSlot],
      background: { ...DEFAULT_BACKGROUND, ...bg },
      outputWidth: outputW,
      outputHeight: outputH,
    }
    return _makeComposition(name ?? 'Desktop + Mobile', 'laptop+phone', config)
  }

  function createAutoComposition(
    snipIds: string[],
    name?: string,
    bg?: Partial<BackgroundConfig>,
  ): Composition {
    const config: CollageCompositionConfig = {
      slots: snipIds.map((snipId) => ({ snipId })),
      template: 'auto',
      gap: 24,
      background: { ...DEFAULT_BACKGROUND, ...bg },
      outputWidth: outputW,
      outputHeight: outputH,
    }
    return _makeComposition(name ?? 'Auto-Collage', 'auto', config)
  }

  function createFreeformComposition(
    snipIds: string[],
    name?: string,
    bg?: Partial<BackgroundConfig>,
  ): Composition {
    const slots: FreeformSlotConfig[] = snipIds.map((snipId, i) => {
      const snip = snipsStore.snips.find((s) => s.id === snipId)
      const cols = Math.ceil(Math.sqrt(snipIds.length))
      const col = i % cols
      const row = Math.floor(i / cols)
      const cx = (outputW / (cols + 1)) * (col + 1)
      const cy = (outputH / (Math.ceil(snipIds.length / cols) + 1)) * (row + 1)
      return makeSlot(snipId, snip?.width ?? 800, snip?.height ?? 600, 'none', cx, cy, outputW, outputH)
    })
    const config: FreeformCompositionConfig = {
      slots,
      background: { ...DEFAULT_BACKGROUND, ...bg },
      outputWidth: outputW,
      outputHeight: outputH,
    }
    return _makeComposition(name ?? 'Freeform', 'freeform', config)
  }

  function updateComposition(id: string, patch: Partial<Composition>) {
    store.updateComposition(id, patch)
    scheduleSave()
  }

  function deleteComposition(id: string) {
    store.removeComposition(id)
    scheduleSave()
  }

  return {
    createLaptopComposition,
    createLaptopPhoneComposition,
    createAutoComposition,
    createFreeformComposition,
    updateComposition,
    deleteComposition,
  }
}
