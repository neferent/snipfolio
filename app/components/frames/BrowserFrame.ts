import { drawCoverFromTop } from './frameUtils'
import type { FrameDrawResult } from './frameUtils'
export type { FrameDrawResult } from './frameUtils'

// SVG coordinate space (browser.svg)
const SVG_W = 1757.49
const TOOLBAR_SVG_H = 45.3    // top bar height in SVG coords
const CORNER_SVG_R = 12.23    // outer body corner radius in SVG coords

// Traffic light dots in SVG coords
const TRAFFIC_Y = 22.04
const DOT_R = 6.96
const RED_X = 32.48
const YEL_X = 55.68
const GRN_X = 78.88

export function browserToolbarHeight(contentW: number): number {
  return Math.max(32, TOOLBAR_SVG_H * (contentW / SVG_W))
}

/** Exact pixel size the screen content is drawn at for a frame of this width/height (toolbar consumes
 *  the top of the box, so the drawable screen area is the full width but a shorter height). */
export function getScreenDrawSize(width: number, height: number): { width: number; height: number } {
  return { width, height: Math.max(1, height - browserToolbarHeight(width)) }
}

export function drawBrowserFrame(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  imageSource: CanvasImageSource,
  color = '#262c44',
  urlText?: string,
): FrameDrawResult {
  const sx = w / SVG_W
  const toolbarH = Math.max(32, TOOLBAR_SVG_H * sx)
  const r = Math.max(4, CORNER_SVG_R * sx)

  // Scale dots proportionally to actual toolbar height so they stay round when clamped
  const dotSx = toolbarH / TOOLBAR_SVG_H
  const dotR = DOT_R * dotSx
  const dotCy = y + toolbarH / 2

  const contentY = y + toolbarH
  const contentH = h - toolbarH

  const screenX = x
  const screenY = contentY
  const screenWidth = w
  const screenHeight = contentH

  // Drop shadow
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.5)'
  ctx.shadowBlur = 30
  ctx.shadowOffsetY = 12
  ctx.fillStyle = color
  roundedRect(ctx, x, y, w, h, r)
  ctx.fill()
  ctx.restore()

  // Body
  ctx.save()
  ctx.strokeStyle = 'rgba(0,0,0,0)'
  ctx.fillStyle = color
  roundedRect(ctx, x, y, w, h, r)
  ctx.fill()
  ctx.restore()

  // Traffic lights
  ctx.save()
  ctx.strokeStyle = 'rgba(0,0,0,0)'
  ctx.fillStyle = '#fe5e56'
  ctx.beginPath()
  ctx.arc(x + RED_X * dotSx, dotCy, dotR, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#febc2c'
  ctx.beginPath()
  ctx.arc(x + YEL_X * dotSx, dotCy, dotR, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#28c840'
  ctx.beginPath()
  ctx.arc(x + GRN_X * dotSx, dotCy, dotR, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // Address bar — right of traffic lights, centered in toolbar
  const barLeft = x + (GRN_X + DOT_R + 16) * dotSx
  const barRight = x + w - 12 * dotSx
  const barW = barRight - barLeft
  if (barW > 40) {
    const barH = Math.round(toolbarH * 0.52)
    const barY = y + (toolbarH - barH) / 2
    const barR = barH / 2

    ctx.save()
    ctx.fillStyle = 'rgba(255,255,255,0.12)'
    roundedRect(ctx, barLeft, barY, barW, barH, barR)
    ctx.fill()

    if (urlText) {
      const fontSize = Math.max(10, barH * 0.5)
      ctx.font = `${fontSize}px system-ui, sans-serif`
      ctx.fillStyle = 'rgba(255,255,255,0.65)'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const maxTextW = barW - fontSize * 1.5
      let text = urlText
      while (text.length > 1 && ctx.measureText(text).width > maxTextW) {
        text = text.slice(0, -1)
      }
      if (text !== urlText && text.length > 1) text = text.slice(0, -1) + '…'
      ctx.fillText(text, barLeft + barW / 2, barY + barH / 2)
    }

    ctx.restore()
  }

  // Content area — clipped to bottom rounded corners of outer body
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(x, contentY)
  ctx.lineTo(x + w, contentY)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, contentY)
  ctx.closePath()
  ctx.clip()
  drawCoverFromTop(ctx, imageSource, x, contentY, w, contentH)
  ctx.restore()

  return { screenX, screenY, screenWidth, screenHeight }
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}
