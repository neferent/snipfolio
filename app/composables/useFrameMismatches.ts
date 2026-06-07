import type { Composition, DeviceFrame, Snip } from '~/types'
import { isFreeformConfig } from '~/types'

export interface FrameMismatch {
  slotId: string
  snipLabel: string
  frameName: string
}

// Screen area aspect ratios (w/h) for each frame type
const FRAME_SCREEN_ASPECT: Partial<Record<DeviceFrame, number>> = {
  phone:  (743.7  - 34.05) / (1569.89 - 30.12), // ≈ 0.461
  tablet: (2377.7 - 79.14) / (1803.11 - 80.08), // ≈ 1.334
  laptop: 3034.7 / 1964.07,                       // ≈ 1.545
}

const FRAME_LABEL: Partial<Record<DeviceFrame, string>> = {
  phone: 'Mobile', tablet: 'Tablet', laptop: 'Desktop',
}

export function getFrameMismatches(composition: Composition, snips: Snip[]): FrameMismatch[] {
  if (!isFreeformConfig(composition.config)) return []
  const out: FrameMismatch[] = []
  for (const slot of composition.config.slots) {
    const expected = FRAME_SCREEN_ASPECT[slot.deviceFrame]
    if (expected === undefined) continue
    const snip = snips.find((s) => s.id === slot.snipId)
    if (!snip) continue
    if (Math.abs(snip.width / snip.height / expected - 1) > 0.05) {
      out.push({
        slotId: slot.id,
        snipLabel: snip.label,
        frameName: FRAME_LABEL[slot.deviceFrame] ?? slot.deviceFrame,
      })
    }
  }
  return out
}
