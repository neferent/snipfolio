import type { DeviceFrame } from '~/types'

export interface SnipPackInput {
  width: number // natural image pixel width
  height: number // natural image pixel height
  frame: DeviceFrame
}

export interface PackedRect {
  x: number
  y: number
  w: number // total slot width including frame bezel
  h: number // total slot height including frame bezel
}

export interface PackingResult {
  rects: (PackedRect | null)[] // indexed same as input; null = didn't fit
  allFit: boolean
}

const SCALE_STEP = 0.12
const MIN_BASE_SCALE = 0.005

// Scale-down resistance exponents per frame type.
// Lower = less affected by baseScale reduction = protected from shrinking.
const FRAME_EXPONENT: Record<DeviceFrame, number> = {
  phone: 0.1,
  tablet: 0.2,
  laptop: 0.4,
  browser: 0.7,
  none: 1.0,
}

// Total slot size multipliers accounting for frame bezel overhead.
const FRAME_SLOT_MULT: Record<DeviceFrame, { x: number; y: number }> = {
  phone: { x: 1.089, y: 1.039 },
  tablet: { x: 1.093, y: 1.173 },
  laptop: { x: 1.471, y: 1.304 },
  browser: { x: 1.0, y: 1.08 },
  none: { x: 1.0, y: 1.0 },
}

interface FreeRect {
  x: number
  y: number
  w: number
  h: number
}

export function packSnips(
  canvasW: number,
  canvasH: number,
  gap: number,
  snips: SnipPackInput[],
): PackingResult {
  const pad = gap
  const iW = canvasW - pad * 2
  const iH = canvasH - pad * 2
  const n = snips.length

  if (n === 0) return { rects: [], allFit: true }

  if (n === 1) {
    const s = snips[0]!
    const m = FRAME_SLOT_MULT[s.frame]
    const scale = Math.min(1, iW / (s.width * m.x), iH / (s.height * m.y))
    const w = Math.round(s.width * scale * m.x)
    const h = Math.round(s.height * scale * m.y)
    return {
      rects: [{ x: pad + Math.round((iW - w) / 2), y: pad + Math.round((iH - h) / 2), w, h }],
      allFit: true,
    }
  }

  // Largest natural area placed first — they anchor the layout.
  const order = [...Array(n).keys()].sort(
    (a, b) => snips[b]!.width * snips[b]!.height - snips[a]!.width * snips[a]!.height,
  )

  const maxNatW = Math.max(...snips.map((s) => s.width))
  const maxNatH = Math.max(...snips.map((s) => s.height))

  // Initial scale: fit the largest snip in the canvas interior (never upscale),
  // capped at the scale where total snip area ≈ 65% of canvas.
  const maxAllowedScale = Math.min(1, iW / maxNatW, iH / maxNatH)
  const sumNatArea = snips.reduce((s, p) => s + p.width * p.height, 0)
  const targetFillScale = Math.sqrt((iW * iH * 0.65) / sumNatArea)
  let baseScale = Math.min(maxAllowedScale, targetFillScale)

  while (baseScale >= MIN_BASE_SCALE) {
    const result = tryPack(snips, order, gap, pad, iW, iH, baseScale)
    if (result.allFit) return result
    baseScale *= 1 - SCALE_STEP
  }

  return { rects: new Array(n).fill(null), allFit: false }
}

// MAXRECT packing with best-short-side-fit (BSSF) heuristic.
//
// BSSF picks the free rectangle where the snip leaves the least leftover on its
// shorter side. This causes wide snips to prefer wide regions (bottom strip) and
// tall snips to prefer tall regions (right column), naturally producing a 2D
// magazine-style grid rather than everything piling up in a single row.
function tryPack(
  snips: SnipPackInput[],
  order: number[],
  gap: number,
  pad: number,
  iW: number,
  iH: number,
  baseScale: number,
): PackingResult {
  const freeRects: FreeRect[] = [{ x: pad, y: pad, w: iW, h: iH }]
  const rects: (PackedRect | null)[] = new Array(snips.length).fill(null)

  for (const i of order) {
    const s = snips[i]!
    const effScale = Math.pow(baseScale, FRAME_EXPONENT[s.frame])
    const m = FRAME_SLOT_MULT[s.frame]
    const slotW = Math.max(4, Math.round(s.width * effScale * m.x))
    const slotH = Math.max(4, Math.round(s.height * effScale * m.y))

    // Best short-side fit: smallest leftover on the shorter axis after placing.
    let bestIdx = -1
    let bestScore = Infinity
    for (let j = 0; j < freeRects.length; j++) {
      const fr = freeRects[j]!
      if (fr.w >= slotW && fr.h >= slotH) {
        const score = Math.min(fr.w - slotW, fr.h - slotH)
        if (score < bestScore) {
          bestScore = score
          bestIdx = j
        }
      }
    }

    if (bestIdx === -1) return { rects, allFit: false }

    const fr = freeRects[bestIdx]!
    rects[i] = { x: fr.x, y: fr.y, w: slotW, h: slotH }

    // Footprint: snip area plus gap on each trailing edge (clamped to canvas).
    const fpX2 = Math.min(fr.x + slotW + gap, pad + iW)
    const fpY2 = Math.min(fr.y + slotH + gap, pad + iH)

    // Clip every free rect that overlaps the footprint into up to 4 sub-rects.
    const next: FreeRect[] = []
    for (const rect of freeRects) {
      if (!overlaps(rect, fr.x, fr.y, fpX2, fpY2)) {
        next.push(rect)
        continue
      }
      if (rect.x < fr.x) next.push({ x: rect.x, y: rect.y, w: fr.x - rect.x, h: rect.h })
      if (rect.x + rect.w > fpX2) next.push({ x: fpX2, y: rect.y, w: rect.x + rect.w - fpX2, h: rect.h })
      if (rect.y < fr.y) next.push({ x: rect.x, y: rect.y, w: rect.w, h: fr.y - rect.y })
      if (rect.y + rect.h > fpY2) next.push({ x: rect.x, y: fpY2, w: rect.w, h: rect.y + rect.h - fpY2 })
    }

    // Prune sub-rects that are fully contained within another (dominated).
    freeRects.length = 0
    outer: for (let j = 0; j < next.length; j++) {
      const a = next[j]!
      for (let k = 0; k < next.length; k++) {
        if (k === j) continue
        const b = next[k]!
        if (b.x <= a.x && b.y <= a.y && b.x + b.w >= a.x + a.w && b.y + b.h >= a.y + a.h) {
          continue outer
        }
      }
      freeRects.push(a)
    }
  }

  return { rects, allFit: true }
}

function overlaps(r: FreeRect, x1: number, y1: number, x2: number, y2: number): boolean {
  return r.x < x2 && r.x + r.w > x1 && r.y < y2 && r.y + r.h > y1
}
