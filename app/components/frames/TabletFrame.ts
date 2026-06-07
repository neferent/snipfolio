export interface FrameDrawResult {
  screenX: number
  screenY: number
  screenWidth: number
  screenHeight: number
}

// SVG coordinate space (tablet SVG)
const SVG_W = 2449.87
const SVG_H = 1877.1

// Screen content area in SVG coords (was the white fill)
const SCR_X = 79.14
const SCR_Y = 80.08
const SCR_W = 2377.7 - 79.14   // 2298.56
const SCR_H = 1803.11 - 80.08  // 1723.03

function screenPath(ctx: CanvasRenderingContext2D) {
  ctx.beginPath()
  ctx.moveTo(124.6, 80.08)
  ctx.lineTo(2332.24, 80.08)
  ctx.bezierCurveTo(2357.3468647273075, 80.08, 2377.7, 100.43313527269211, 2377.7, 125.54)
  ctx.lineTo(2377.7, 1757.65)
  ctx.bezierCurveTo(2377.7, 1782.7568647273076, 2357.3468647273075, 1803.11, 2332.24, 1803.11)
  ctx.lineTo(124.6, 1803.11)
  ctx.bezierCurveTo(99.49313527269211, 1803.11, 79.14, 1782.7568647273076, 79.14, 1757.65)
  ctx.lineTo(79.14, 125.54)
  ctx.bezierCurveTo(79.14, 100.43313527269211, 99.49313527269211, 80.08, 124.6, 80.08)
  ctx.closePath()
}

export function drawTabletFrame(
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

  // Drop shadow — full body silhouette
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.5)'
  ctx.shadowBlur = 30 / Math.min(sx, sy)
  ctx.shadowOffsetY = 12 / Math.min(sx, sy)
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(2449.87, 125.97)
  ctx.lineTo(2449.87, 1756.84)
  ctx.bezierCurveTo(2449.87, 1823.26, 2396.02, 1877.1, 2329.6, 1877.1)
  ctx.lineTo(127.89, 1877.1)
  ctx.bezierCurveTo(61.47, 1877.1, 7.63, 1823.26, 7.63, 1756.84)
  ctx.lineTo(7.63, 230.62)
  ctx.lineTo(0, 230.62)
  ctx.lineTo(0, 127.57)
  ctx.lineTo(7.63, 127.57)
  ctx.lineTo(7.63, 125.97)
  ctx.bezierCurveTo(7.63, 59.55, 61.47, 5.7, 127.89, 5.7)
  ctx.lineTo(172.33, 5.7)
  ctx.lineTo(172.33, 0)
  ctx.lineTo(260.08, 0)
  ctx.lineTo(260.08, 5.7)
  ctx.lineTo(278.44, 5.7)
  ctx.lineTo(278.44, 0)
  ctx.lineTo(364.15, 0)
  ctx.lineTo(364.15, 5.7)
  ctx.lineTo(2329.6, 5.7)
  ctx.bezierCurveTo(2396.02, 5.7, 2449.87, 59.55, 2449.87, 125.97)
  ctx.closePath()
  ctx.fill()
  ctx.restore()

  // Outer body
  ctx.save()
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(2449.87, 125.97)
  ctx.lineTo(2449.87, 1756.84)
  ctx.bezierCurveTo(2449.87, 1823.26, 2396.02, 1877.1, 2329.6, 1877.1)
  ctx.lineTo(127.89, 1877.1)
  ctx.bezierCurveTo(61.47, 1877.1, 7.63, 1823.26, 7.63, 1756.84)
  ctx.lineTo(7.63, 230.62)
  ctx.lineTo(0, 230.62)
  ctx.lineTo(0, 127.57)
  ctx.lineTo(7.63, 127.57)
  ctx.lineTo(7.63, 125.97)
  ctx.bezierCurveTo(7.63, 59.55, 61.47, 5.7, 127.89, 5.7)
  ctx.lineTo(172.33, 5.7)
  ctx.lineTo(172.33, 0)
  ctx.lineTo(260.08, 0)
  ctx.lineTo(260.08, 5.7)
  ctx.lineTo(278.44, 5.7)
  ctx.lineTo(278.44, 0)
  ctx.lineTo(364.15, 0)
  ctx.lineTo(364.15, 5.7)
  ctx.lineTo(2329.6, 5.7)
  ctx.bezierCurveTo(2396.02, 5.7, 2449.87, 59.55, 2449.87, 125.97)
  ctx.closePath()
  ctx.fill()
  ctx.restore()

  // Inner bezel ring (black)
  ctx.save()
  ctx.fillStyle = '#000000'
  ctx.beginPath()
  ctx.moveTo(132.9, 17.54)
  ctx.lineTo(2324.97, 17.54)
  ctx.bezierCurveTo(2388.8472541654296, 17.54, 2440.63, 69.32274583457041, 2440.63, 133.2)
  ctx.lineTo(2440.63, 1749.86)
  ctx.bezierCurveTo(2440.63, 1813.7372541654295, 2388.8472541654296, 1865.52, 2324.97, 1865.52)
  ctx.lineTo(132.9, 1865.52)
  ctx.bezierCurveTo(69.02274583457043, 1865.52, 17.24, 1813.7372541654295, 17.24, 1749.86)
  ctx.lineTo(17.24, 133.2)
  ctx.bezierCurveTo(17.24, 69.32274583457041, 69.02274583457043, 17.54, 132.9, 17.54)
  ctx.closePath()
  ctx.fill()
  ctx.restore()

  // Screen content clipped to screen shape
  ctx.save()
  screenPath(ctx)
  ctx.clip()
  ctx.drawImage(imageSource, SCR_X - 1, SCR_Y - 1, SCR_W + 2, SCR_H + 2)
  ctx.restore()

  // Front camera dot
  ctx.save()
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(1154.23, 47, 8.42, 0, Math.PI * 2, false)
  ctx.fill()
  ctx.restore()

  ctx.restore()

  return { screenX, screenY, screenWidth, screenHeight }
}
