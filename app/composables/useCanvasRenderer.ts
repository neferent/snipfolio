import { drawPhoneFrame } from '~/components/frames/PhoneFrame'
import { drawBrowserFrame } from '~/components/frames/BrowserFrame'
import { drawLaptopFrame } from '~/components/frames/LaptopFrame'
import type {
  Snip,
  Composition,
  SingleCompositionConfig,
  CollageCompositionConfig,
  BackgroundConfig,
  CaptionConfig,
  DeviceFrame,
  SnipSlotConfig,
  CollageLayoutTemplate,
} from '~/types'
import { isSingleConfig, isCollageConfig } from '~/types'

export interface RenderInput {
  composition: Composition
  snips: Snip[]
  sourceImage: HTMLImageElement
}

export function useCanvasRenderer() {
  function render(canvas: HTMLCanvasElement, input: RenderInput) {
    const { composition, snips, sourceImage } = input
    const cfg = composition.config
    const ctx = canvas.getContext('2d')!
    canvas.width = cfg.outputWidth
    canvas.height = cfg.outputHeight
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (isSingleConfig(cfg)) {
      renderSingle(ctx, cfg, snips, sourceImage)
    } else if (isCollageConfig(cfg)) {
      renderCollage(ctx, cfg, snips, sourceImage)
    }
  }

  return { render }
}

// --- Single composition ---
function renderSingle(
  ctx: CanvasRenderingContext2D,
  cfg: SingleCompositionConfig,
  snips: Snip[],
  source: HTMLImageElement,
) {
  const { outputWidth: W, outputHeight: H } = cfg
  drawBackground(ctx, W, H, cfg.background, source)

  const snip = snips.find((s) => s.id === cfg.snipId)
  if (!snip) return

  const contentCanvas = extractSnip(snip, source)
  const aspect = snip.width / snip.height

  // Compute framed size preserving aspect
  const maxW = W * cfg.scale
  const maxH = H * cfg.scale
  let fw = maxW
  let fh = fw / aspect
  if (fh > maxH) {
    fh = maxH
    fw = fh * aspect
  }

  // Add frame padding
  const framePad = computeFramePadding(cfg.deviceFrame, fw, fh)
  const totalW = fw + framePad.left + framePad.right
  const totalH = fh + framePad.top + framePad.bottom

  const cx = W / 2 + cfg.offsetX
  const cy = H / 2 + cfg.offsetY
  const drawX = cx - totalW / 2
  const drawY = cy - totalH / 2

  drawFramedContent(ctx, cfg.deviceFrame, contentCanvas, drawX, drawY, totalW, totalH)

  if (cfg.caption) {
    drawCaption(ctx, cfg.caption, drawX, drawY, totalW, totalH)
  }
}

// --- Collage composition ---
function renderCollage(
  ctx: CanvasRenderingContext2D,
  cfg: CollageCompositionConfig,
  snips: Snip[],
  source: HTMLImageElement,
) {
  const { outputWidth: W, outputHeight: H } = cfg
  drawBackground(ctx, W, H, cfg.background, source)

  const slots = cfg.slots
  const layout = computeCollageLayout(cfg.template, W, H, slots.length, cfg.gap)

  slots.forEach((slot, i) => {
    const rect = layout[i]
    if (!rect) return
    const snip = snips.find((s) => s.id === slot.snipId)
    if (!snip) return
    const content = extractSnip(snip, source)

    // Subtract frame padding from available slot area to get max content area
    const estPad = computeFramePadding(slot.deviceFrame, rect.w, rect.h)
    const availW = rect.w - estPad.left - estPad.right
    const availH = rect.h - estPad.top - estPad.bottom

    // Scale snip to fill available content area while preserving aspect ratio
    const scale = Math.min(availW / snip.width, availH / snip.height)
    const contentW = snip.width * scale
    const contentH = snip.height * scale

    // Recompute padding based on actual content size, then get total framed dimensions
    const framePad = computeFramePadding(slot.deviceFrame, contentW, contentH)
    const totalW = contentW + framePad.left + framePad.right
    const totalH = contentH + framePad.top + framePad.bottom

    // Center the framed item within the slot
    const drawX = rect.x + (rect.w - totalW) / 2
    const drawY = rect.y + (rect.h - totalH) / 2

    drawFramedContent(ctx, slot.deviceFrame, content, drawX, drawY, totalW, totalH)
    if (slot.caption) {
      drawCaption(ctx, slot.caption, drawX, drawY, totalW, totalH)
    }
  })

  if (cfg.globalCaption) {
    drawCaption(ctx, cfg.globalCaption, 0, 0, W, H)
  }
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
    // Draw a scaled-up blurred region from the source image
    const region = bg.blurRegion ?? { x: 0, y: 0, width: source.naturalWidth, height: source.naturalHeight }
    const tmpCanvas = document.createElement('canvas')
    tmpCanvas.width = W
    tmpCanvas.height = H
    const tmpCtx = tmpCanvas.getContext('2d')!
    tmpCtx.filter = 'blur(24px)'
    tmpCtx.drawImage(
      source,
      region.x,
      region.y,
      region.width,
      region.height,
      -20,
      -20,
      W + 40,
      H + 40,
    )
    // Darken overlay
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
    const bezel = Math.max(10, contentW * 0.06)
    return { left: bezel, right: bezel, top: bezel, bottom: bezel }
  }
  if (frame === 'browser') {
    const toolbarH = Math.max(36, contentH * 0.048)
    return { left: 0, right: 0, top: toolbarH, bottom: 0 }
  }
  if (frame === 'laptop') {
    const bezel = Math.max(14, contentW * 0.03)
    const baseH = Math.max(20, contentH * 0.08)
    return { left: bezel, right: bezel, top: bezel, bottom: bezel + baseH }
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
) {
  switch (frame) {
    case 'phone':
      drawPhoneFrame(ctx, x, y, w, h, content)
      break
    case 'browser':
      drawBrowserFrame(ctx, x, y, w, h, content)
      break
    case 'laptop':
      drawLaptopFrame(ctx, x, y, w, h, content)
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

// --- Layout calculator ---
interface SlotRect {
  x: number
  y: number
  w: number
  h: number
}

function computeCollageLayout(
  template: CollageLayoutTemplate,
  W: number,
  H: number,
  count: number,
  gap: number,
): SlotRect[] {
  const pad = gap * 2
  const iW = W - pad * 2
  const iH = H - pad * 2

  switch (template) {
    case '2-horizontal': {
      const slotW = (iW - gap) / 2
      return [
        { x: pad, y: pad, w: slotW, h: iH },
        { x: pad + slotW + gap, y: pad, w: slotW, h: iH },
      ]
    }
    case '2-vertical': {
      const slotH = (iH - gap) / 2
      return [
        { x: pad, y: pad, w: iW, h: slotH },
        { x: pad, y: pad + slotH + gap, w: iW, h: slotH },
      ]
    }
    case '3-up': {
      const bigW = iW * 0.56 - gap / 2
      const smallW = iW - bigW - gap
      const smallH = (iH - gap) / 2
      return [
        { x: pad, y: pad, w: bigW, h: iH },
        { x: pad + bigW + gap, y: pad, w: smallW, h: smallH },
        { x: pad + bigW + gap, y: pad + smallH + gap, w: smallW, h: smallH },
      ]
    }
    case '2x2': {
      const slotW = (iW - gap) / 2
      const slotH = (iH - gap) / 2
      return [
        { x: pad, y: pad, w: slotW, h: slotH },
        { x: pad + slotW + gap, y: pad, w: slotW, h: slotH },
        { x: pad, y: pad + slotH + gap, w: slotW, h: slotH },
        { x: pad + slotW + gap, y: pad + slotH + gap, w: slotW, h: slotH },
      ]
    }
    case '1+2-stacked': {
      const bigH = iH * 0.56 - gap / 2
      const smallH = iH - bigH - gap
      const smallW = (iW - gap) / 2
      return [
        { x: pad, y: pad, w: iW, h: bigH },
        { x: pad, y: pad + bigH + gap, w: smallW, h: smallH },
        { x: pad + smallW + gap, y: pad + bigH + gap, w: smallW, h: smallH },
      ]
    }
    case 'free':
    default: {
      // Even grid fallback for free mode
      const cols = Math.ceil(Math.sqrt(count))
      const rows = Math.ceil(count / cols)
      const slotW = (iW - gap * (cols - 1)) / cols
      const slotH = (iH - gap * (rows - 1)) / rows
      return Array.from({ length: count }, (_, i) => ({
        x: pad + (i % cols) * (slotW + gap),
        y: pad + Math.floor(i / cols) * (slotH + gap),
        w: slotW,
        h: slotH,
      }))
    }
  }
}

// --- Helpers ---
function extractSnip(snip: Snip, source: HTMLImageElement): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = snip.width
  c.height = snip.height
  const ctx = c.getContext('2d')!
  ctx.drawImage(source, snip.x, snip.y, snip.width, snip.height, 0, 0, snip.width, snip.height)
  return c
}
