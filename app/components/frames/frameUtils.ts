export interface FrameDrawResult {
  screenX: number
  screenY: number
  screenWidth: number
  screenHeight: number
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
