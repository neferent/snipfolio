import { applyScaledShadow } from './frameUtils'
import type { FrameDrawResult } from './frameUtils'
export type { FrameDrawResult } from './frameUtils'

// SVG coordinate space (mobile.svg)
const SVG_W = 772.5
const SVG_H = 1600

// Screen content area in SVG coords
const SCR_X = 34.05
const SCR_Y = 30.12
const SCR_W = 743.7 - SCR_X   // 709.65
const SCR_H = 1569.89 - SCR_Y // 1539.77

function screenPath(ctx: CanvasRenderingContext2D) {
  ctx.beginPath()
  ctx.moveTo(743.7, 141.2)
  ctx.lineTo(743.7, 1458.79)
  ctx.bezierCurveTo(743.7, 1520.15, 693.96, 1569.89, 632.6, 1569.89)
  ctx.lineTo(145.13, 1569.89)
  ctx.bezierCurveTo(83.77, 1569.89, 34.05, 1520.15, 34.05, 1458.79)
  ctx.lineTo(34.05, 141.2)
  ctx.bezierCurveTo(34.05, 79.85, 83.78, 30.12, 145.13, 30.12)
  ctx.lineTo(632.61, 30.12)
  ctx.bezierCurveTo(653.23, 30.12, 672.53, 35.74, 689.08, 45.53)
  ctx.bezierCurveTo(721.77, 64.86, 743.71, 100.47, 743.71, 141.2)
  ctx.closePath()
}

export function drawPhoneFrame(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  imageSource: CanvasImageSource,
  color = '#262c44',
): FrameDrawResult {
  const sx = width / SVG_W
  const sy = height / SVG_H

  const screenX = x + SCR_X * sx
  const screenY = y + SCR_Y * sy
  const screenWidth = SCR_W * sx
  const screenHeight = SCR_H * sy

  ctx.save()
  ctx.translate(x, y)
  ctx.scale(sx, sy)
  ctx.strokeStyle = 'rgba(0,0,0,0)'
  ctx.miterLimit = 4

  // Drop shadow on the body
  applyScaledShadow(ctx, sx, sy, color, () => {
    ctx.beginPath()
    ctx.moveTo(777.74, 497.55)
    ctx.lineTo(777.74, 687.4)
    ctx.lineTo(772.5, 687.4)
    ctx.lineTo(772.5, 1461.25)
    ctx.bezierCurveTo(772.5, 1537.89, 710.37, 1600, 633.75, 1600)
    ctx.lineTo(143.97, 1600)
    ctx.bezierCurveTo(67.35, 1600, 5.23, 1537.89, 5.23, 1461.25)
    ctx.lineTo(5.23, 726.68)
    ctx.lineTo(0, 726.68)
    ctx.lineTo(0, 608.84)
    ctx.lineTo(5.24, 608.84)
    ctx.lineTo(5.24, 574.8)
    ctx.lineTo(0, 574.8)
    ctx.lineTo(0, 456.96)
    ctx.lineTo(5.24, 456.96)
    ctx.lineTo(5.24, 401.97)
    ctx.lineTo(0, 401.97)
    ctx.lineTo(0, 328.65)
    ctx.lineTo(5.24, 328.65)
    ctx.lineTo(5.24, 138.74)
    ctx.bezierCurveTo(5.24, 62.11, 67.35, 0, 143.97, 0)
    ctx.lineTo(633.75, 0)
    ctx.bezierCurveTo(710.37, 0, 772.5, 62.11, 772.5, 138.74)
    ctx.lineTo(772.5, 497.55)
    ctx.lineTo(777.74, 497.55)
    ctx.closePath()
  })

  // Metal frame ring — black, creates the visible bezel around the screen
  ctx.save()
  ctx.fillStyle = '#000000'
  ctx.beginPath()
  ctx.moveTo(143.78, 10.47)
  ctx.lineTo(633.96, 10.47)
  ctx.bezierCurveTo(705.41, 10.47, 763.34, 68.40, 763.34, 139.85)
  ctx.lineTo(763.34, 1458.83)
  ctx.bezierCurveTo(763.34, 1530.28, 705.41, 1588.21, 633.96, 1588.21)
  ctx.lineTo(143.78, 1588.21)
  ctx.bezierCurveTo(72.33, 1588.21, 14.4, 1530.28, 14.4, 1458.83)
  ctx.lineTo(14.4, 139.85)
  ctx.bezierCurveTo(14.4, 68.40, 72.33, 10.47, 143.78, 10.47)
  ctx.closePath()
  ctx.fill()
  ctx.restore()

  // Screen content clipped to screen shape
  // No white fill — any sub-pixel anti-aliasing at the edge reads against the black ring (correct)
  ctx.save()
  screenPath(ctx)
  ctx.clip()
  ctx.drawImage(imageSource, SCR_X - 1, SCR_Y - 1, SCR_W + 2, SCR_H + 2)
  ctx.restore()



  ctx.restore()

  return { screenX, screenY, screenWidth, screenHeight }
}
