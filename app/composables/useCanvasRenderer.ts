import { drawPhoneFrame } from '~/components/frames/PhoneFrame'
import { drawBrowserFrame, browserToolbarHeight } from '~/components/frames/BrowserFrame'
import { drawLaptopFrame } from '~/components/frames/LaptopFrame'
import type {
  Snip,
  Composition,
  FreeformCompositionConfig,
  CollageCompositionConfig,
  BackgroundConfig,
  CaptionConfig,
  DeviceFrame,
} from '~/types'
import { isFreeformConfig, isCollageConfig } from '~/types'

export interface RenderInput {
  composition: Composition
  snips: Snip[]
  sourceImages: Map<string, HTMLImageElement>
  watermark?: boolean
}

export function useCanvasRenderer() {
  function render(canvas: HTMLCanvasElement, input: RenderInput) {
    const { composition, snips, sourceImages, watermark = false } = input
    const cfg = composition.config
    const ctx = canvas.getContext('2d')!
    canvas.width = cfg.outputWidth
    canvas.height = cfg.outputHeight
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (isFreeformConfig(cfg)) {
      renderFreeform(ctx, cfg, snips, sourceImages, watermark)
    } else if (isCollageConfig(cfg)) {
      renderCollage(ctx, cfg, snips, sourceImages, watermark)
    }
  }

  return { render }
}

// Pick the source image that belongs to this composition's snips, not an arbitrary map entry.
function pickBackgroundSource(
  slotSnipIds: string[],
  snips: Snip[],
  sourceImages: Map<string, HTMLImageElement>,
): HTMLImageElement | undefined {
  for (const snipId of slotSnipIds) {
    const snip = snips.find((s) => s.id === snipId)
    if (snip) {
      const img = sourceImages.get(snip.sourceImageId)
      if (img) return img
    }
  }
  return undefined
}

// --- Freeform composition ---
function renderFreeform(
  ctx: CanvasRenderingContext2D,
  cfg: FreeformCompositionConfig,
  snips: Snip[],
  sourceImages: Map<string, HTMLImageElement>,
  watermark: boolean,
) {
  const { outputWidth: W, outputHeight: H } = cfg
  const bgSource = pickBackgroundSource(cfg.slots.map((s) => s.snipId), snips, sourceImages)
  if (bgSource) drawBackground(ctx, W, H, cfg.background, bgSource)
  if (watermark) drawDiagonalWatermark(ctx, W, H)

  // Render back to front (index 0 = back)
  for (const slot of cfg.slots) {
    const snip = snips.find((s) => s.id === slot.snipId)
    if (!snip) continue
    const snipSource = sourceImages.get(snip.sourceImageId) ?? bgSource
    if (!snipSource) continue
    const content = extractSnip(snip, snipSource)
    drawFramedContent(ctx, slot.deviceFrame, content, slot.x, slot.y, slot.width, slot.height, slot.frameColor)
  }

  if (watermark) drawBadge(ctx, W, H)
}

// --- Collage composition ---
function renderCollage(
  ctx: CanvasRenderingContext2D,
  cfg: CollageCompositionConfig,
  snips: Snip[],
  sourceImages: Map<string, HTMLImageElement>,
  watermark: boolean,
) {
  const { outputWidth: W, outputHeight: H } = cfg
  const bgSource = pickBackgroundSource(cfg.slots.map((s) => s.snipId), snips, sourceImages)
  if (bgSource) drawBackground(ctx, W, H, cfg.background, bgSource)
  if (watermark) drawDiagonalWatermark(ctx, W, H)

  const slots = cfg.slots
  const aspects = slots.map((slot) => {
    const snip = snips.find((s) => s.id === slot.snipId)
    return snip ? snip.width / snip.height : 1
  })
  const areas = slots.map((slot) => {
    const snip = snips.find((s) => s.id === slot.snipId)
    return snip ? snip.width * snip.height : 1
  })
  const layout = computeJustifiedLayout(W, H, cfg.gap, aspects, areas)

  slots.forEach((slot, i) => {
    const rect = layout[i]
    if (!rect) return
    const snip = snips.find((s) => s.id === slot.snipId)
    if (!snip) return
    const snipSource = sourceImages.get(snip.sourceImageId) ?? bgSource
    if (!snipSource) return

    // Cover-fill: frames not used in auto-collage, content may be clipped.
    const scale = Math.max(rect.w / snip.width, rect.h / snip.height)
    const dw = snip.width * scale
    const dh = snip.height * scale
    const dx = rect.x + (rect.w - dw) / 2
    const dy = rect.y + (rect.h - dh) / 2
    ctx.save()
    ctx.beginPath()
    ctx.rect(rect.x, rect.y, rect.w, rect.h)
    ctx.clip()
    ctx.drawImage(snipSource, snip.x, snip.y, snip.width, snip.height, dx, dy, dw, dh)
    ctx.restore()

    if (slot.caption) {
      drawCaption(ctx, slot.caption, rect.x, rect.y, rect.w, rect.h)
    }
  })

  if (cfg.globalCaption) {
    drawCaption(ctx, cfg.globalCaption, 0, 0, W, H)
  }

  if (watermark) drawBadge(ctx, W, H)
}

// --- Watermarks ---
function drawDiagonalWatermark(ctx: CanvasRenderingContext2D, W: number, H: number) {
  ctx.save()
  const fontSize = Math.round(Math.max(18, Math.min(W * 0.016, 40)))
  ctx.font = `${fontSize}px system-ui, sans-serif`
  ctx.fillStyle = '#ffffff'
  ctx.globalAlpha = 0.055
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const text = 'snipfol.io'
  const textW = ctx.measureText(text).width
  const colSpacing = textW * 2.8
  const rowSpacing = fontSize * 3.8

  const diagLen = Math.ceil(Math.sqrt(W * W + H * H))
  const cols = Math.ceil((diagLen * 2) / colSpacing) + 2
  const rows = Math.ceil((diagLen * 2) / rowSpacing) + 2

  ctx.translate(W / 2, H / 2)
  ctx.rotate(-Math.PI / 6)

  for (let r = -rows; r <= rows; r++) {
    for (let c = -cols; c <= cols; c++) {
      const x = c * colSpacing + (r % 2 === 0 ? 0 : colSpacing / 2)
      const y = r * rowSpacing
      ctx.fillText(text, x, y)
    }
  }
  ctx.restore()
}

function drawBadge(ctx: CanvasRenderingContext2D, W: number, H: number) {
  ctx.save()

  const fontSize = Math.round(Math.max(10, Math.min(W * 0.008, 14)))
  const iconSize = Math.round(fontSize * 1.5)
  const padH = Math.round(fontSize * 0.65)
  const padV = Math.round(fontSize * 0.5)
  const gap = Math.round(fontSize * 0.5)
  const cornerPad = Math.round(Math.max(12, W * 0.012))
  const radius = Math.round(fontSize * 0.4)

  ctx.font = `${fontSize}px system-ui, sans-serif`
  const label = 'Made with snipfol.io'
  const textW = ctx.measureText(label).width
  const badgeW = padH + iconSize + gap + textW + padH
  const badgeH = padV * 2 + Math.max(iconSize, fontSize)

  const bx = W - cornerPad - badgeW
  const by = H - cornerPad - badgeH

  ctx.fillStyle = 'rgba(0,0,0,0.52)'
  ctx.beginPath()
  ctx.roundRect(bx, by, badgeW, badgeH, radius)
  ctx.fill()

  drawLogoIcon(ctx, bx + padH, by + (badgeH - iconSize) / 2, iconSize)

  ctx.fillStyle = '#ffffff'
  ctx.globalAlpha = 1
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, bx + padH + iconSize + gap, by + badgeH / 2)

  ctx.restore()
}

function drawLogoIcon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const s = size / 48
  ctx.save()
  ctx.translate(x, y)

  ctx.fillStyle = '#8e9ead'
  ctx.beginPath()
  ctx.roundRect(0, 0, size, size, size * 0.25)
  ctx.fill()

  ctx.fillStyle = '#373d43'
  ctx.beginPath()
  ctx.roundRect(8 * s, 7.82 * s, 17 * s, 24 * s, 2.5 * s)
  ctx.fill()

  ctx.fillStyle = '#373d43'
  ctx.beginPath()
  ctx.roundRect(28.1 * s, 7.82 * s, 12 * s, 13 * s, 2.5 * s)
  ctx.fill()

  ctx.fillStyle = '#565f69'
  ctx.beginPath()
  ctx.roundRect(28.1 * s, 23.82 * s, 12 * s, 16 * s, 2.5 * s)
  ctx.fill()

  ctx.restore()
}

// --- Background ---
function drawBackground(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  bg: BackgroundConfig,
  source: HTMLImageElement,
) {
  ctx.save()
  if (bg.type === 'solid') {
    ctx.fillStyle = bg.color
    ctx.fillRect(0, 0, W, H)
  } else if (bg.type === 'gradient') {
    const angle = ((bg.gradientAngle ?? 135) * Math.PI) / 180
    const cx = W / 2
    const cy = H / 2
    const len = Math.sqrt(W * W + H * H) / 2
    const gx1 = cx - Math.cos(angle) * len
    const gy1 = cy - Math.sin(angle) * len
    const gx2 = cx + Math.cos(angle) * len
    const gy2 = cy + Math.sin(angle) * len
    const grad = ctx.createLinearGradient(gx1, gy1, gx2, gy2)
    grad.addColorStop(0, bg.gradientStart)
    grad.addColorStop(1, bg.gradientEnd)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)
  } else if (bg.type === 'blur') {
    const region = bg.blurRegion ?? { x: 0, y: 0, width: source.naturalWidth, height: source.naturalHeight }
    const tmpCanvas = document.createElement('canvas')
    tmpCanvas.width = W
    tmpCanvas.height = H
    const tmpCtx = tmpCanvas.getContext('2d')!
    tmpCtx.imageSmoothingEnabled = true
    tmpCtx.imageSmoothingQuality = 'high'
    tmpCtx.filter = 'blur(24px)'
    tmpCtx.drawImage(source, region.x, region.y, region.width, region.height, -20, -20, W + 40, H + 40)
    tmpCtx.fillStyle = 'rgba(0,0,0,0.4)'
    tmpCtx.fillRect(0, 0, W, H)
    ctx.drawImage(tmpCanvas, 0, 0)
  }
  ctx.restore()
}

// --- Frame utilities ---
interface Padding {
  left: number
  right: number
  top: number
  bottom: number
}

function computeFramePadding(frame: DeviceFrame, contentW: number, contentH: number): Padding {
  if (frame === 'phone') {
    return {
      left: contentW * 0.048,
      right: contentW * 0.041,
      top: contentH * 0.0196,
      bottom: contentH * 0.0196,
    }
  }
  if (frame === 'browser') {
    return { left: 0, right: 0, top: browserToolbarHeight(contentW), bottom: 0 }
  }
  if (frame === 'laptop') {
    return {
      left: contentW * 0.2333,
      right: contentW * 0.2380,
      top: contentH * 0.096,
      bottom: contentH * 0.2079,
    }
  }
  return { left: 0, right: 0, top: 0, bottom: 0 }
}

function drawFramedContent(
  ctx: CanvasRenderingContext2D,
  frame: DeviceFrame,
  content: HTMLCanvasElement,
  x: number,
  y: number,
  w: number,
  h: number,
  frameColor?: string,
) {
  switch (frame) {
    case 'phone':
      drawPhoneFrame(ctx, x, y, w, h, content, frameColor)
      break
    case 'browser':
      drawBrowserFrame(ctx, x, y, w, h, content, frameColor)
      break
    case 'laptop':
      drawLaptopFrame(ctx, x, y, w, h, content, frameColor)
      break
    default:
      ctx.drawImage(content, x, y, w, h)
  }
}

// --- Caption ---
function drawCaption(
  ctx: CanvasRenderingContext2D,
  cap: CaptionConfig,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const fontSize = cap.size
  const padding = fontSize * 0.6
  const bgH = fontSize + padding * 2

  const bgY = cap.position === 'top' ? y : y + h - bgH
  ctx.save()
  ctx.fillStyle = `rgba(0,0,0,${cap.bgOpacity})`
  ctx.fillRect(x, bgY, w, bgH)

  ctx.fillStyle = cap.color
  ctx.font = `${fontSize}px system-ui, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(cap.text, x + w / 2, bgY + bgH / 2)
  ctx.restore()
}

// --- Justified grid layout ---
function computeJustifiedLayout(
  W: number,
  H: number,
  gap: number,
  aspects: number[],
  areas: number[],
): Array<{ x: number; y: number; w: number; h: number }> {
  const pad = gap
  const iW = W - pad * 2
  const iH = H - pad * 2
  const n = aspects.length

  if (n === 0) return []
  if (n === 1) return [{ x: pad, y: pad, w: iW, h: iH }]

  const order = [...Array(n).keys()].sort((a, b) => areas[b]! - areas[a]!)
  const sortedAspects = order.map((i) => aspects[i]!)

  let bestRows: number[][] = []
  let bestScore = Infinity

  for (let R = 1; R <= n; R++) {
    const rows = partitionIntoRows(sortedAspects, R)
    const totalH =
      rows.reduce((s, row) => {
        const sumA = row.reduce((a, j) => a + sortedAspects[j]!, 0)
        return s + (iW - gap * (row.length - 1)) / sumA
      }, 0) +
      gap * (rows.length - 1)

    const score = totalH > iH ? totalH / iH : iH / totalH
    if (score < bestScore) {
      bestScore = score
      bestRows = rows
    }
  }

  const naturalH = bestRows.map((row) => {
    const sumA = row.reduce((s, j) => s + sortedAspects[j]!, 0)
    return (iW - gap * (row.length - 1)) / sumA
  })

  const totalNatH = naturalH.reduce((s, h) => s + h, 0) + gap * (bestRows.length - 1)
  const vScale = iH / totalNatH

  const rects: Array<{ x: number; y: number; w: number; h: number }> = new Array(n)

  let yAcc = pad
  for (let r = 0; r < bestRows.length; r++) {
    const row = bestRows[r]!
    const rowH = naturalH[r]! * vScale
    const rowHInt = r < bestRows.length - 1 ? Math.round(rowH) : pad + iH - yAcc

    const sumA = row.reduce((s, j) => s + sortedAspects[j]!, 0)
    const rowGaps = gap * (row.length - 1)

    let xAcc = pad
    for (let c = 0; c < row.length; c++) {
      const j = row[c]!
      const wFloat = (sortedAspects[j]! / sumA) * (iW - rowGaps)
      const wInt = c < row.length - 1 ? Math.round(wFloat) : pad + iW - xAcc
      rects[order[j]!] = { x: xAcc, y: yAcc, w: wInt, h: rowHInt }
      xAcc += wInt + gap
    }
    yAcc += rowHInt + gap
  }

  return rects
}

function partitionIntoRows(aspects: number[], R: number): number[][] {
  const n = aspects.length
  if (R >= n) return aspects.map((_, i) => [i])
  if (R === 1) return [aspects.map((_, i) => i)]

  const target = aspects.reduce((s, a) => s + a, 0) / R
  const rows: number[][] = []
  let row: number[] = []
  let rowSum = 0

  for (let i = 0; i < n; i++) {
    row.push(i)
    rowSum += aspects[i]!

    const rowsLeft = R - rows.length - 1
    const itemsLeft = n - i - 1

    if (rowsLeft > 0 && itemsLeft >= rowsLeft && rowSum >= target) {
      rows.push([...row])
      row = []
      rowSum = 0
    }
  }

  if (row.length > 0) rows.push(row)
  return rows
}

// --- Helpers ---
function extractSnip(snip: Snip, source: HTMLImageElement): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = snip.width
  c.height = snip.height
  const ctx = c.getContext('2d')!
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(source, snip.x, snip.y, snip.width, snip.height, 0, 0, snip.width, snip.height)
  return c
}
