export interface FrameDrawResult {
  screenX: number
  screenY: number
  screenWidth: number
  screenHeight: number
}

export function drawBrowserFrame(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  imageSource: CanvasImageSource,
  urlLabel = 'example.com',
): FrameDrawResult {
  const toolbarH = Math.max(36, Math.round(height * 0.048))
  const radius = 10
  const screenX = x
  const screenY = y + toolbarH
  const screenW = width
  const screenH = height - toolbarH

  // Outer shadow
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.35)'
  ctx.shadowBlur = 20
  ctx.shadowOffsetY = 6

  // Window chrome
  ctx.fillStyle = '#e8e8e8'
  ctx.beginPath()
  ctx.roundRect(x, y, width, height, [radius, radius, 0, 0])
  ctx.fill()
  ctx.restore()

  // Toolbar separator
  ctx.fillStyle = '#d0d0d0'
  ctx.fillRect(x, y + toolbarH - 1, width, 1)

  // Traffic lights
  const dotY = y + toolbarH / 2
  const dotR = Math.max(5, toolbarH * 0.18)
  const dotSpacing = dotR * 2.4
  const dotStartX = x + toolbarH * 0.6

  const dots = [
    { color: '#ff5f57', border: '#e0443e' },
    { color: '#febc2e', border: '#d4a017' },
    { color: '#28c840', border: '#1aaa2f' },
  ]
  dots.forEach(({ color, border }, i) => {
    const cx = dotStartX + i * dotSpacing
    ctx.beginPath()
    ctx.arc(cx, dotY, dotR, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.fill()
    ctx.strokeStyle = border
    ctx.lineWidth = 0.5
    ctx.stroke()
  })

  // URL bar
  const urlBarPadding = dotStartX + dots.length * dotSpacing + toolbarH * 0.5
  const urlBarRight = x + width - toolbarH * 0.6
  const urlBarW = urlBarRight - urlBarPadding
  const urlBarH = toolbarH * 0.56
  const urlBarY = y + toolbarH / 2 - urlBarH / 2

  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.roundRect(urlBarPadding, urlBarY, urlBarW, urlBarH, urlBarH / 2)
  ctx.fill()
  ctx.strokeStyle = '#c8c8c8'
  ctx.lineWidth = 0.5
  ctx.beginPath()
  ctx.roundRect(urlBarPadding, urlBarY, urlBarW, urlBarH, urlBarH / 2)
  ctx.stroke()

  // Lock icon (simple)
  const lockSize = urlBarH * 0.45
  const lockX = urlBarPadding + urlBarH * 0.6
  const lockY = y + toolbarH / 2
  ctx.fillStyle = '#888'
  ctx.beginPath()
  ctx.arc(lockX, lockY - lockSize * 0.15, lockSize * 0.38, Math.PI, 0, false)
  ctx.stroke()
  ctx.fillStyle = '#888'
  ctx.beginPath()
  ctx.roundRect(lockX - lockSize * 0.3, lockY - lockSize * 0.1, lockSize * 0.6, lockSize * 0.55, 2)
  ctx.fill()

  // URL text
  ctx.save()
  ctx.fillStyle = '#444'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const fontSize = Math.max(10, urlBarH * 0.54)
  ctx.font = `${fontSize}px system-ui, sans-serif`
  ctx.beginPath()
  ctx.rect(urlBarPadding + urlBarH * 1.2, urlBarY, urlBarW - urlBarH * 1.8, urlBarH)
  ctx.clip()
  ctx.fillText(urlLabel, urlBarPadding + urlBarW / 2, y + toolbarH / 2)
  ctx.restore()

  // Screen area — white background then content
  ctx.fillStyle = '#fff'
  ctx.fillRect(screenX, screenY, screenW, screenH)

  ctx.save()
  ctx.beginPath()
  ctx.rect(screenX, screenY, screenW, screenH)
  ctx.clip()
  ctx.drawImage(imageSource, screenX, screenY, screenW, screenH)
  ctx.restore()

  // Window border
  ctx.strokeStyle = '#c0c0c0'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.roundRect(x + 0.5, y + 0.5, width - 1, height - 1, [radius, radius, 0, 0])
  ctx.stroke()

  return { screenX, screenY, screenWidth: screenW, screenHeight: screenH }
}
