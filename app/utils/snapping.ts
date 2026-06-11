export interface SnapRect {
  x: number
  y: number
  w: number
  h: number
}

export interface SnapLines {
  vertical: number[]
  horizontal: number[]
}

/** Collects left/center/right and top/center/bottom lines from a set of rects, plus optional bounds. */
export function collectSnapLines(rects: SnapRect[], bounds?: { width: number; height: number }): SnapLines {
  const vertical = new Set<number>()
  const horizontal = new Set<number>()
  for (const r of rects) {
    vertical.add(r.x)
    vertical.add(r.x + r.w / 2)
    vertical.add(r.x + r.w)
    horizontal.add(r.y)
    horizontal.add(r.y + r.h / 2)
    horizontal.add(r.y + r.h)
  }
  if (bounds) {
    vertical.add(0)
    vertical.add(bounds.width / 2)
    vertical.add(bounds.width)
    horizontal.add(0)
    horizontal.add(bounds.height / 2)
    horizontal.add(bounds.height)
  }
  return { vertical: [...vertical], horizontal: [...horizontal] }
}

function closestSnap(points: number[], targets: number[], threshold: number): { delta: number; line: number } | null {
  let best: { delta: number; line: number; dist: number } | null = null
  for (const p of points) {
    for (const t of targets) {
      const dist = Math.abs(p - t)
      if (dist <= threshold && (!best || dist < best.dist)) {
        best = { delta: t - p, line: t, dist }
      }
    }
  }
  return best ? { delta: best.delta, line: best.line } : null
}

export interface MoveSnapResult {
  dx: number
  dy: number
  snappedX: boolean
  snappedY: boolean
  vLine: number | null
  hLine: number | null
}

/** Snaps a moving rect's left/center/right and top/center/bottom edges to the nearest target lines. */
export function snapMove(rect: SnapRect, targets: SnapLines, threshold: number): MoveSnapResult {
  const xPoints = [rect.x, rect.x + rect.w / 2, rect.x + rect.w]
  const yPoints = [rect.y, rect.y + rect.h / 2, rect.y + rect.h]
  const xSnap = closestSnap(xPoints, targets.vertical, threshold)
  const ySnap = closestSnap(yPoints, targets.horizontal, threshold)
  return {
    dx: xSnap?.delta ?? 0,
    dy: ySnap?.delta ?? 0,
    snappedX: !!xSnap,
    snappedY: !!ySnap,
    vLine: xSnap?.line ?? null,
    hLine: ySnap?.line ?? null,
  }
}

export interface EdgeSnapResult {
  value: number
  line: number | null
}

/** Snaps a single edge coordinate to the nearest target line. */
export function snapEdge(value: number, targets: number[], threshold: number): EdgeSnapResult {
  let best: { value: number; line: number; dist: number } | null = null
  for (const t of targets) {
    const dist = Math.abs(value - t)
    if (dist <= threshold && (!best || dist < best.dist)) {
      best = { value: t, line: t, dist }
    }
  }
  return best ? { value: best.value, line: best.line } : { value, line: null }
}
