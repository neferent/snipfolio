import { computeJustifiedLayout, partitionIntoRows } from '~/utils/justifiedLayout'
import { drawPhoneFrame } from '~/components/frames/PhoneFrame'
import { drawTabletFrame } from '~/components/frames/TabletFrame'
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
  backgroundImage?: HTMLImageElement
  watermark?: boolean
}

export function useCanvasRenderer() {
  function render(canvas: HTMLCanvasElement, input: RenderInput) {
    const { composition, snips, sourceImages, backgroundImage, watermark = false } = input
    const cfg = composition.config
    const ctx = canvas.getContext('2d')!
    canvas.width = cfg.outputWidth
    canvas.height = cfg.outputHeight
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (isFreeformConfig(cfg)) {
      renderFreeform(ctx, cfg, snips, sourceImages, backgroundImage, watermark)
    } else if (isCollageConfig(cfg)) {
      renderCollage(ctx, cfg, snips, sourceImages, backgroundImage, watermark)
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
  backgroundImage: HTMLImageElement | undefined,
  watermark: boolean,
) {
  const { outputWidth: W, outputHeight: H } = cfg
  const bgSource = pickBackgroundSource(cfg.slots.map((s) => s.snipId), snips, sourceImages)
  drawBackground(ctx, W, H, cfg.background, bgSource, backgroundImage)
  if (watermark) drawDiagonalWatermark(ctx, W, H)

  // Render back to front (index 0 = back)
  for (const slot of cfg.slots) {
    const snip = snips.find((s) => s.id === slot.snipId)
    if (!snip) continue
    const snipSource = sourceImages.get(snip.sourceImageId) ?? bgSource
    if (!snipSource) continue
    const content = extractSnip(snip, snipSource)
    drawFramedContent(ctx, slot.deviceFrame, content, slot.x, slot.y, slot.width, slot.height, slot.frameColor)
    if (slot.caption) {
      const scr = getFrameScreenBounds(slot.deviceFrame, slot.x, slot.y, slot.width, slot.height)
      drawCaption(ctx, slot.caption, scr.x, scr.y, scr.w, scr.h, scr.r)
    }
  }

  if (watermark) drawBadge(ctx, W, H)
}

// --- Collage composition ---
function renderCollage(
  ctx: CanvasRenderingContext2D,
  cfg: CollageCompositionConfig,
  snips: Snip[],
  sourceImages: Map<string, HTMLImageElement>,
  backgroundImage: HTMLImageElement | undefined,
  watermark: boolean,
) {
  const { outputWidth: W, outputHeight: H } = cfg
  const bgSource = pickBackgroundSource(cfg.slots.map((s) => s.snipId), snips, sourceImages)
  drawBackground(ctx, W, H, cfg.background, bgSource, backgroundImage)
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
  source: HTMLImageElement | undefined,
  bgImage: HTMLImageElement | undefined,
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
  } else if (bg.type === 'image' && bgImage) {
    const iW = bgImage.naturalWidth
    const iH = bgImage.naturalHeight
    const scale = Math.max(W / iW, H / iH)
    const dw = iW * scale
    const dh = iH * scale
    ctx.drawImage(bgImage, (W - dw) / 2, (H - dh) / 2, dw, dh)
  } else if (bg.type === 'blur' && source) {
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

  if (bg.noiseOpacity && bg.noiseOpacity > 0) {
    drawNoise(ctx, W, H, bg.noiseOpacity)
  }
}

let _noiseCachedCanvas: HTMLCanvasElement | null = null
let _noiseCachedOpacity = -1

function drawNoise(ctx: CanvasRenderingContext2D, W: number, H: number, opacity: number) {
  if (!_noiseCachedCanvas || _noiseCachedOpacity !== opacity) {
    const size = 200
    const noiseCanvas = document.createElement('canvas')
    noiseCanvas.width = size
    noiseCanvas.height = size
    const nc = noiseCanvas.getContext('2d')!
    const imageData = nc.createImageData(size, size)
    const { data } = imageData
    for (let i = 0; i < data.length; i += 4) {
      const v = (Math.random() * 255) | 0
      data[i] = v
      data[i + 1] = v
      data[i + 2] = v
      data[i + 3] = (opacity * 255) | 0
    }
    nc.putImageData(imageData, 0, 0)
    _noiseCachedCanvas = noiseCanvas
    _noiseCachedOpacity = opacity
  }
  ctx.save()
  const pattern = ctx.createPattern(_noiseCachedCanvas, 'repeat')!
  ctx.fillStyle = pattern
  ctx.fillRect(0, 0, W, H)
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
  if (frame === 'tablet') {
    return {
      left: contentW * 0.0467,
      right: contentW * 0.0467,
      top: contentH * 0.0838,
      bottom: contentH * 0.0890,
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
    case 'tablet':
      drawTabletFrame(ctx, x, y, w, h, content, frameColor)
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

interface ScreenBounds { x: number; y: number; w: number; h: number; r: number }

function getFrameScreenBounds(
  frame: DeviceFrame,
  slotX: number,
  slotY: number,
  slotW: number,
  slotH: number,
): ScreenBounds {
  if (frame === 'phone') {
    // SVG_W=772.5, SVG_H=1600; SCR_X=34.05, SCR_Y=30.12, SCR_W=709.65, SCR_H=1539.77
    return {
      x: slotX + (34.05 / 772.5) * slotW,
      y: slotY + (30.12 / 1600) * slotH,
      w: (709.65 / 772.5) * slotW,
      h: (1539.77 / 1600) * slotH,
      r: (111.08 / 772.5) * slotW,
    }
  }
  if (frame === 'tablet') {
    // SVG_W=2449.87, SVG_H=1877.1; SCR_X=79.14, SCR_Y=80.08, SCR_W=2298.56, SCR_H=1723.03
    return {
      x: slotX + (79.14 / 2449.87) * slotW,
      y: slotY + (80.08 / 1877.1) * slotH,
      w: (2298.56 / 2449.87) * slotW,
      h: (1723.03 / 1877.1) * slotH,
      r: (45.46 / 2449.87) * slotW,
    }
  }
  if (frame === 'laptop') {
    // SVG_W=3809.99, SVG_H=2300; SCR_X=387.63, SCR_Y=59.07, SCR_W=3034.7, SCR_H=1964.07
    return {
      x: slotX + (387.63 / 3809.99) * slotW,
      y: slotY + (59.07 / 2300) * slotH,
      w: (3034.7 / 3809.99) * slotW,
      h: (1964.07 / 2300) * slotH,
      r: 0,
    }
  }
  return { x: slotX, y: slotY, w: slotW, h: slotH, r: 0 }
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate
    } else {
      if (current) lines.push(current)
      current = word
    }
  }
  if (current) lines.push(current)
  return lines.length ? lines : ['']
}

function drawCaption(
  ctx: CanvasRenderingContext2D,
  cap: CaptionConfig,
  x: number,
  y: number,
  w: number,
  h: number,
  cornerRadius = 0,
) {
  const fontSize = cap.size
  const padding = fontSize * 0.6
  const lineHeight = fontSize * 1.35
  const weight = cap.fontWeight ?? 'normal'
  const family = cap.fontFamily ?? 'system-ui, sans-serif'
  const align = cap.align ?? 'center'

  ctx.save()

  // Set font before measuring so word-wrap is accurate
  ctx.font = `${weight} ${fontSize}px ${family}`
  const lines = wrapText(ctx, cap.text, w - padding * 2)
  const bgH = lines.length * lineHeight + padding * 2

  const bgY = cap.position === 'top' ? y : y + h - bgH

  // Clip to screen content area so background respects rounded frame corners
  ctx.beginPath()
  if (cornerRadius > 0) {
    ctx.roundRect(x, y, w, h, cornerRadius)
  } else {
    ctx.rect(x, y, w, h)
  }
  ctx.clip()

  ctx.fillStyle = `rgba(0,0,0,${cap.bgOpacity})`
  ctx.fillRect(x, bgY, w, bgH)

  ctx.fillStyle = cap.color
  ctx.textAlign = align
  ctx.textBaseline = 'middle'

  const textX = align === 'left' ? x + padding : align === 'right' ? x + w - padding : x + w / 2
  lines.forEach((line, i) => {
    const lineY = bgY + padding + lineHeight * (i + 0.5)
    ctx.fillText(line, textX, lineY)
  })

  ctx.restore()
}

// computeJustifiedLayout and partitionIntoRows live in ~/utils/justifiedLayout.ts

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
