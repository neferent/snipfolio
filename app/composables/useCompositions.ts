import { useCompositionsStore } from '~/stores/compositions'
import { useProjectStore } from '~/stores/project'
import { useSnipsStore } from '~/stores/snips'
import { useProject } from '~/composables/useProject'
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

/** Geometry for the "Desktop + Mobile" layout: a laptop frame with a phone overlapping its right edge, centered on the canvas. */
export function getLaptopPhoneLayout(
  outputW: number,
  outputH: number,
): { laptop: { x: number; y: number; width: number; height: number }; phone: { x: number; y: number; width: number; height: number } } {
  // Laptop sized to ~78% of output height (capped to avoid overflow)
  const laptopAspect = FRAME_ASPECT.laptop!
  let laptopH = outputH * 0.78
  let laptopW = laptopH * laptopAspect
  if (laptopW > outputW * 0.85) {
    laptopW = outputW * 0.85
    laptopH = laptopW / laptopAspect
  }

  // Phone sized to ~86% of output height, overlapping the laptop's right edge
  const phoneAspect = FRAME_ASPECT.phone!
  const phoneH = outputH * 0.86
  const phoneW = phoneH * phoneAspect
  const overlap = phoneW * 0.4

  // Center the combined bounding box of both frames on the canvas
  const totalWidth = laptopW + phoneW - overlap
  const startX = (outputW - totalWidth) / 2

  return {
    laptop: {
      x: Math.round(startX),
      y: Math.round((outputH - laptopH) / 2),
      width: Math.round(laptopW),
      height: Math.round(laptopH),
    },
    phone: {
      x: Math.round(startX + laptopW - overlap),
      y: Math.round((outputH - phoneH) / 2),
      width: Math.round(phoneW),
      height: Math.round(phoneH),
    },
  }
}

/** Geometry for the "Desktop" layout: a single laptop frame centered on the canvas. */
export function getLaptopLayout(
  outputW: number,
  outputH: number,
): { x: number; y: number; width: number; height: number } {
  const { w, h } = defaultSlotDimensions(0, 0, 'laptop', outputW, outputH)
  return {
    x: Math.round((outputW - w) / 2),
    y: Math.round((outputH - h) / 2),
    width: Math.round(w),
    height: Math.round(h),
  }
}

/** Geometry for the "Freeform" layout: snips arranged in a centered grid, sized to fit naturally. */
export function getFreeformGridLayout(
  snips: { width: number; height: number }[],
  outputW: number,
  outputH: number,
): { x: number; y: number; width: number; height: number }[] {
  const cols = Math.ceil(Math.sqrt(snips.length))
  return snips.map((snip, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    const cx = (outputW / (cols + 1)) * (col + 1)
    const cy = (outputH / (Math.ceil(snips.length / cols) + 1)) * (row + 1)
    const { w, h } = defaultSlotDimensions(snip.width, snip.height, 'none', outputW, outputH)
    return {
      x: Math.round(cx - w / 2),
      y: Math.round(cy - h / 2),
      width: Math.round(w),
      height: Math.round(h),
    }
  })
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
    const slot: FreeformSlotConfig = {
      id: crypto.randomUUID(),
      snipId,
      deviceFrame: 'laptop',
      ...getLaptopLayout(outputW, outputH),
    }
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
    const layout = getLaptopPhoneLayout(outputW, outputH)
    const laptopSlot: FreeformSlotConfig = {
      id: crypto.randomUUID(),
      snipId: laptopSnipId,
      deviceFrame: 'laptop',
      ...layout.laptop,
    }
    const phoneSlot: FreeformSlotConfig = {
      id: crypto.randomUUID(),
      snipId: phoneSnipId,
      deviceFrame: 'phone',
      ...layout.phone,
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
    const layout = getFreeformGridLayout(
      snipIds.map((snipId) => {
        const snip = snipsStore.snips.find((s) => s.id === snipId)
        return { width: snip?.width ?? 800, height: snip?.height ?? 600 }
      }),
      outputW,
      outputH,
    )
    const slots: FreeformSlotConfig[] = snipIds.map((snipId, i) => ({
      id: crypto.randomUUID(),
      snipId,
      deviceFrame: 'none',
      ...layout[i]!,
    }))
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
