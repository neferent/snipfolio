import { describe, it, expect } from 'vitest'
import { partitionIntoRows, computeJustifiedLayout } from '~/utils/justifiedLayout'

describe('partitionIntoRows', () => {
  it('R=1 puts everything in one row', () => {
    const rows = partitionIntoRows([1, 1.5, 0.75], 1)
    expect(rows).toHaveLength(1)
    expect(rows[0]).toEqual([0, 1, 2])
  })

  it('R >= n gives one item per row', () => {
    const rows = partitionIntoRows([1, 1.5, 0.75], 5)
    expect(rows).toHaveLength(3)
    rows.forEach((row) => expect(row).toHaveLength(1))
  })

  it('accounts for all items', () => {
    const rows = partitionIntoRows([1, 1, 1, 1], 2)
    expect(rows.flat().sort((a, b) => a - b)).toEqual([0, 1, 2, 3])
  })

  it('produces the requested number of rows when possible', () => {
    const aspects = [1, 1, 1, 1, 1, 1]
    const rows = partitionIntoRows(aspects, 3)
    expect(rows).toHaveLength(3)
  })
})

describe('computeJustifiedLayout', () => {
  it('returns empty for no items', () => {
    expect(computeJustifiedLayout(1000, 800, 10, [], [])).toEqual([])
  })

  it('single item fills the inner area', () => {
    const rects = computeJustifiedLayout(1000, 800, 0, [1.5], [1])
    expect(rects).toHaveLength(1)
    expect(rects[0]).toEqual({ x: 0, y: 0, w: 1000, h: 800 })
  })

  it('single item with gap fills the inner area', () => {
    const rects = computeJustifiedLayout(1000, 800, 20, [1.5], [1])
    expect(rects).toHaveLength(1)
    expect(rects[0]).toEqual({ x: 20, y: 20, w: 960, h: 760 })
  })

  it('returns a rect for every input item', () => {
    const aspects = [1.5, 1.0, 2.0, 0.75]
    const areas = [1, 1, 1, 1]
    const rects = computeJustifiedLayout(1000, 800, 10, aspects, areas)
    expect(rects).toHaveLength(4)
    rects.forEach((r) => expect(r).toBeDefined())
  })

  it('no rects overlap', () => {
    const aspects = [1.5, 1.0, 2.0, 0.75]
    const areas = [1, 1, 1, 1]
    const rects = computeJustifiedLayout(1000, 800, 10, aspects, areas)

    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        const a = rects[i]!
        const b = rects[j]!
        // Shrink by 1px to avoid false positives from rounding at shared edges
        const overlap =
          a.x + 1 < b.x + b.w &&
          a.x + a.w - 1 > b.x &&
          a.y + 1 < b.y + b.h &&
          a.y + a.h - 1 > b.y
        expect(overlap, `rect ${i} overlaps rect ${j}`).toBe(false)
      }
    }
  })

  it('all rects stay within canvas bounds', () => {
    const aspects = [1.5, 1.0, 2.0, 0.75]
    const areas = [1, 1, 1, 1]
    const rects = computeJustifiedLayout(1000, 800, 10, aspects, areas)

    for (const r of rects) {
      expect(r.x).toBeGreaterThanOrEqual(0)
      expect(r.y).toBeGreaterThanOrEqual(0)
      expect(r.x + r.w).toBeLessThanOrEqual(1000 + 1) // +1 for rounding
      expect(r.y + r.h).toBeLessThanOrEqual(800 + 1)
    }
  })
})
