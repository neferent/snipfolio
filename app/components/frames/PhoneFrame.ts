export interface FrameDrawResult {
  screenX: number
  screenY: number
  screenWidth: number
  screenHeight: number
}

export function drawPhoneFrame(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  imageSource: CanvasImageSource,
): FrameDrawResult {
  const radius = Math.min(44, width * 0.1)
  const bezel = Math.max(10, width * 0.06)
  const screenX = x + bezel
  const screenY = y + bezel
  const screenW = width - bezel * 2
  const screenH = height - bezel * 2
  const screenR = Math.max(2, radius - bezel * 0.5)

  // Outer shadow
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.45)'
  ctx.shadowBlur = 24
  ctx.shadowOffsetY = 8

  // Bezel body
  ctx.fillStyle = '#1c1c1e'
  roundRect(ctx, x, y, width, height, radius)
  ctx.fill()

  ctx.restore()

  // Subtle highlight on bezel edge
  ctx.save()
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'
  ctx.lineWidth = 1
  roundRect(ctx, x + 0.5, y + 0.5, width - 1, height - 1, radius)
  ctx.stroke()
  ctx.restore()

  // Screen background
  ctx.save()
  ctx.fillStyle = '#000'
  roundRect(ctx, screenX, screenY, screenW, screenH, screenR)
  ctx.fill()

  // Clip and draw content
  roundRect(ctx, screenX, screenY, screenW, screenH, screenR)
  ctx.clip()
  ctx.drawImage(imageSource, screenX, screenY, screenW, screenH)
  ctx.restore()

  // Dynamic Island / pill notch
  const pillW = Math.round(width * 0.28)
  const pillH = Math.round(height * 0.028)
  const pillX = x + width / 2 - pillW / 2
  const pillY = screenY + Math.round(screenH * 0.012)
  ctx.fillStyle = '#000'
  ctx.beginPath()
  ctx.roundRect(pillX, pillY, pillW, pillH, pillH / 2)
  ctx.fill()

  // Home indicator bar
  const indW = Math.round(width * 0.3)
  const indH = Math.max(3, Math.round(height * 0.006))
  const indX = x + width / 2 - indW / 2
  const indY = y + height - bezel - indH - Math.round(height * 0.008)
  ctx.fillStyle = 'rgba(255,255,255,0.3)'
  ctx.beginPath()
  ctx.roundRect(indX, indY, indW, indH, indH / 2)
  ctx.fill()

  // Side buttons (volume, power) — decorative lines
  const btnW = Math.max(2, bezel * 0.35)
  const btnH = Math.round(height * 0.08)
  ctx.fillStyle = '#2a2a2e'

  // Left volume buttons
  ctx.beginPath()
  ctx.roundRect(x - btnW + 1, y + height * 0.22, btnW, btnH * 0.7, 1)
  ctx.fill()
  ctx.beginPath()
  ctx.roundRect(x - btnW + 1, y + height * 0.32, btnW, btnH, 1)
  ctx.fill()
  ctx.beginPath()
  ctx.roundRect(x - btnW + 1, y + height * 0.44, btnW, btnH, 1)
  ctx.fill()

  // Right power button
  ctx.beginPath()
  ctx.roundRect(x + width - 1, y + height * 0.3, btnW, btnH * 1.2, 1)
  ctx.fill()

  return { screenX, screenY, screenWidth: screenW, screenHeight: screenH }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}
