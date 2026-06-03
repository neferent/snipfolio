export interface FrameDrawResult {
  screenX: number
  screenY: number
  screenWidth: number
  screenHeight: number
}

export function drawLaptopFrame(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  imageSource: CanvasImageSource,
): FrameDrawResult {
  const baseH = Math.round(height * 0.072)
  const bezel = Math.max(14, width * 0.03)
  const screenAreaH = height - baseH
  const screenR = 6

  const screenX = x + bezel
  const screenY = y + bezel
  const screenW = width - bezel * 2
  const screenH = screenAreaH - bezel * 1.8

  // Drop shadow
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.5)'
  ctx.shadowBlur = 30
  ctx.shadowOffsetY = 12

  // Screen lid outer
  ctx.fillStyle = '#2a2a2a'
  ctx.beginPath()
  ctx.roundRect(x, y, width, screenAreaH, [screenR, screenR, 0, 0])
  ctx.fill()
  ctx.restore()

  // Screen inner black frame
  ctx.fillStyle = '#111'
  ctx.beginPath()
  ctx.roundRect(x + 3, y + 3, width - 6, screenAreaH - 3, [screenR - 1, screenR - 1, 0, 0])
  ctx.fill()

  // Screen content background
  ctx.fillStyle = '#000'
  ctx.fillRect(screenX, screenY, screenW, screenH)

  // Draw content
  ctx.save()
  ctx.beginPath()
  ctx.rect(screenX, screenY, screenW, screenH)
  ctx.clip()
  ctx.drawImage(imageSource, screenX, screenY, screenW, screenH)
  ctx.restore()

  // Camera dot at top center
  const camR = Math.max(3, bezel * 0.2)
  const camX = x + width / 2
  const camY = y + bezel * 0.5
  ctx.fillStyle = '#333'
  ctx.beginPath()
  ctx.arc(camX, camY, camR, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = 'rgba(80,160,255,0.25)'
  ctx.beginPath()
  ctx.arc(camX, camY, camR * 0.5, 0, Math.PI * 2)
  ctx.fill()

  // Hinge bar
  const hingeY = y + screenAreaH
  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(x, hingeY, width, 3)

  // Base / keyboard deck
  const baseW = width * 1.06
  const baseX = x - (baseW - width) / 2
  const baseY = hingeY + 3
  const baseRadius = [0, 0, 5, 5] as [number, number, number, number]

  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.4)'
  ctx.shadowBlur = 16
  ctx.shadowOffsetY = 6

  // Base gradient (dark aluminum look)
  const baseGrad = ctx.createLinearGradient(baseX, baseY, baseX, baseY + baseH)
  baseGrad.addColorStop(0, '#3a3a3a')
  baseGrad.addColorStop(0.4, '#2e2e2e')
  baseGrad.addColorStop(1, '#1e1e1e')
  ctx.fillStyle = baseGrad
  ctx.beginPath()
  ctx.roundRect(baseX, baseY, baseW, baseH, baseRadius)
  ctx.fill()
  ctx.restore()

  // Keyboard suggestion — subtle grid of tiny key shapes
  const keyAreaX = baseX + baseW * 0.12
  const keyAreaY = baseY + baseH * 0.18
  const keyAreaW = baseW * 0.76
  const keyAreaH = baseH * 0.52
  const cols = 14
  const rows = 4
  const keyW = (keyAreaW / cols) * 0.82
  const keyH = (keyAreaH / rows) * 0.7
  const kGapX = (keyAreaW - keyW * cols) / (cols - 1)
  const kGapY = (keyAreaH - keyH * rows) / (rows - 1)
  ctx.fillStyle = 'rgba(255,255,255,0.06)'
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const kx = keyAreaX + c * (keyW + kGapX)
      const ky = keyAreaY + r * (keyH + kGapY)
      ctx.beginPath()
      ctx.roundRect(kx, ky, keyW, keyH, 1)
      ctx.fill()
    }
  }

  // Touchpad
  const padW = baseW * 0.22
  const padH = baseH * 0.38
  const padX = baseX + (baseW - padW) / 2
  const padY = baseY + baseH * 0.54
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'
  ctx.lineWidth = 0.5
  ctx.beginPath()
  ctx.roundRect(padX, padY, padW, padH, 3)
  ctx.stroke()

  // Base edge highlight
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.roundRect(baseX + 0.5, baseY + 0.5, baseW - 1, baseH - 1, baseRadius)
  ctx.stroke()

  return { screenX, screenY, screenWidth: screenW, screenHeight: screenH }
}
