import { applyScaledShadow, drawCoverFromTop } from './frameUtils'
import type { FrameDrawResult } from './frameUtils'
export type { FrameDrawResult } from './frameUtils'

// SVG coordinate space (laptop3.svg)
const SVG_W = 3809.99
const SVG_H = 2300

// White screen area in SVG coords
const SCR_X = 387.63, SCR_Y = 59.07
const SCR_W = 3034.7,  SCR_H = 1964.07

export function drawLaptopFrame(
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

  // Shadow pass — full laptop silhouette (lid + base) as one fill so shadow wraps the whole device
  applyScaledShadow(ctx, sx, sy, color, () => {
    ctx.beginPath()
    // lid sub-path
    ctx.moveTo(439.37, 0)
    ctx.lineTo(3370.58, 0)
    ctx.bezierCurveTo(3427.66, 0, 3474.01, 46.34, 3474.01, 103.43)
    ctx.lineTo(3474.01, 2144.96)
    ctx.lineTo(335.94, 2144.96)
    ctx.lineTo(335.94, 103.43)
    ctx.bezierCurveTo(335.94, 46.35, 382.28, 0, 439.37, 0)
    ctx.closePath()
    // base sub-path
    ctx.moveTo(3809.98, 2144.94)
    ctx.lineTo(3809.98, 2207.37)
    ctx.bezierCurveTo(3809.98, 2212.58, 3809.43, 2217.6, 3808.36, 2222.47)
    ctx.bezierCurveTo(3801.46, 2254.15, 3773.25, 2277.85, 3739.51, 2277.85)
    ctx.lineTo(3605.98, 2277.85)
    ctx.lineTo(3588.48, 2300)
    ctx.lineTo(3363.28, 2300)
    ctx.lineTo(3345.78, 2277.85)
    ctx.lineTo(464.21, 2277.85)
    ctx.lineTo(446.71, 2300)
    ctx.lineTo(221.51, 2300)
    ctx.lineTo(204.01, 2277.85)
    ctx.lineTo(70.48, 2277.85)
    ctx.bezierCurveTo(36.7, 2277.85, 8.53, 2254.15, 1.63, 2222.47)
    ctx.bezierCurveTo(0.56, 2217.6, 0.01, 2212.58, 0.01, 2207.37)
    ctx.lineTo(0.01, 2144.94)
    ctx.lineTo(3809.99, 2144.94)
    ctx.closePath()
  })

  // Base / stand
  ctx.save()
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(3809.98, 2144.94)
  ctx.lineTo(3809.98, 2207.37)
  ctx.bezierCurveTo(3809.98, 2212.58, 3809.43, 2217.6, 3808.36, 2222.47)
  ctx.bezierCurveTo(3801.46, 2254.15, 3773.25, 2277.85, 3739.51, 2277.85)
  ctx.lineTo(3605.98, 2277.85)
  ctx.lineTo(3588.48, 2300)
  ctx.lineTo(3363.28, 2300)
  ctx.lineTo(3345.78, 2277.85)
  ctx.lineTo(464.21, 2277.85)
  ctx.lineTo(446.71, 2300)
  ctx.lineTo(221.51, 2300)
  ctx.lineTo(204.01, 2277.85)
  ctx.lineTo(70.48, 2277.85)
  ctx.bezierCurveTo(36.7, 2277.85, 8.53, 2254.15, 1.63, 2222.47)
  ctx.bezierCurveTo(0.56, 2217.6, 0.01, 2212.58, 0.01, 2207.37)
  ctx.lineTo(0.01, 2144.94)
  ctx.lineTo(3809.99, 2144.94)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  ctx.restore()

  // Lid outer body
  ctx.save()
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(439.37, 0)
  ctx.lineTo(3370.58, 0)
  ctx.bezierCurveTo(3427.66, 0, 3474.01, 46.34, 3474.01, 103.43)
  ctx.lineTo(3474.01, 2144.96)
  ctx.lineTo(335.94, 2144.96)
  ctx.lineTo(335.94, 103.43)
  ctx.bezierCurveTo(335.94, 46.35, 382.28, 0, 439.37, 0)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  ctx.restore()

  // Inner bezel
  ctx.save()
  ctx.fillStyle = '#000000'
  ctx.beginPath()
  ctx.moveTo(434.17, 18.46)
  ctx.lineTo(3375.79, 18.46)
  ctx.bezierCurveTo(3419.81, 18.46, 3455.55, 54.2, 3455.55, 98.22)
  ctx.lineTo(3455.55, 2137.57)
  ctx.lineTo(354.4, 2137.57)
  ctx.lineTo(354.4, 98.22)
  ctx.bezierCurveTo(354.4, 54.2, 390.14, 18.46, 434.16, 18.46)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  ctx.restore()

  // Image clipped to screen area
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(3422.33, 91.48)
  ctx.lineTo(3422.33, 2023.14)
  ctx.lineTo(387.63, 2023.14)
  ctx.lineTo(387.63, 91.48)
  ctx.bezierCurveTo(387.63, 73.58, 402.14, 59.07, 420.04, 59.07)
  ctx.lineTo(3389.92, 59.07)
  ctx.bezierCurveTo(3407.82, 59.07, 3422.33, 73.58, 3422.33, 91.48)
  ctx.closePath()
  ctx.clip()
  drawCoverFromTop(ctx, imageSource, SCR_X, SCR_Y, SCR_W, SCR_H)
  ctx.restore()

  // Top notch bar
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(1720.38, 55.38)
  ctx.lineTo(2089.56, 55.38)
  ctx.lineTo(2089.56, 100.64)
  ctx.bezierCurveTo(2089.56, 110.3, 2081.72, 118.14, 2072.06, 118.14)
  ctx.lineTo(1737.88, 118.14)
  ctx.bezierCurveTo(1728.22, 118.14, 1720.38, 110.3, 1720.38, 100.64)
  ctx.lineTo(1720.38, 55.38)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  ctx.restore()

  // Camera dot
  ctx.save()
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(1904.98, 73.84, 7.38, 0, Math.PI * 2)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  ctx.restore()

  // Hinge cover
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(2230.34, 2137.57)
  ctx.bezierCurveTo(2224.43, 2165, 2200.07, 2185.56, 2170.86, 2185.56)
  ctx.lineTo(1624.32, 2185.56)
  ctx.bezierCurveTo(1595.12, 2185.56, 1570.75, 2165, 1564.84, 2137.57)
  ctx.lineTo(2230.33, 2137.57)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  ctx.restore()

  // Bottom shadow overlay
  ctx.save()
  ctx.globalAlpha = 0.14
  ctx.beginPath()
  ctx.moveTo(3808.35, 2222.47)
  ctx.bezierCurveTo(3801.45, 2254.15, 3773.24, 2277.85, 3739.5, 2277.85)
  ctx.lineTo(3605.97, 2277.85)
  ctx.lineTo(3588.47, 2300)
  ctx.lineTo(3363.27, 2300)
  ctx.lineTo(3345.77, 2277.85)
  ctx.lineTo(464.21, 2277.85)
  ctx.lineTo(446.71, 2300)
  ctx.lineTo(221.51, 2300)
  ctx.lineTo(204.01, 2277.85)
  ctx.lineTo(70.48, 2277.85)
  ctx.bezierCurveTo(36.7, 2277.85, 8.53, 2254.15, 1.63, 2222.47)
  ctx.lineTo(3808.36, 2222.47)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  ctx.restore()

  ctx.restore()

  return { screenX, screenY, screenWidth, screenHeight }
}
