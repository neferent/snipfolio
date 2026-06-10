export interface FrameDrawResult {
  screenX: number
  screenY: number
  screenWidth: number
  screenHeight: number
}

/**
 * Draws imageSource into (dx, dy, dw, dh) using cover-from-top semantics:
 * scale to fill the destination width, show from the top of the image, no distortion.
 * If the image is shorter than the destination area a small gap is left at the bottom;
 * if taller, the bottom is cropped (not shown).
 */
export function drawCoverFromTop(
  ctx: CanvasRenderingContext2D,
  imageSource: CanvasImageSource,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
): void {
  const imgW = (imageSource as { width: number }).width
  const imgH = (imageSource as { height: number }).height
  if (!imgW || !imgH) return
  const srcH = Math.min(imgH, imgW * (dh / dw))
  const destH = srcH * (dw / imgW)
  ctx.drawImage(imageSource, 0, 0, imgW, srcH, dx, dy, dw, destH)
}

/**
 * Draws a filled shadow pass for device frames that work in SVG coordinate
 * space (translate+scale applied). The blur/offset are divided by the scale
 * factor so they appear consistent at any rendered size.
 */
export function applyScaledShadow(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  color: string,
  drawPath: () => void,
) {
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.5)'
  ctx.shadowBlur = 30 / Math.min(sx, sy)
  ctx.shadowOffsetY = 12 / Math.min(sx, sy)
  ctx.fillStyle = color
  drawPath()
  ctx.fill()
  ctx.restore()
}
