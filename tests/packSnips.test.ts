import { describe, it, expect } from 'vitest'
import { packSnips } from '~/utils/packSnips'

describe('packSnips', () => {
  it('returns empty when no snips', () => {
    const result = packSnips(1000, 800, 10, [])
    expect(result.rects).toEqual([])
    expect(result.allFit).toBe(true)
  })

  it('single snip fits and is centered', () => {
    const result = packSnips(1000, 800, 0, [{ width: 400, height: 300, frame: 'none' }])
    expect(result.allFit).toBe(true)
    const r = result.rects[0]!
    expect(r).not.toBeNull()
    expect(r.x).toBe(300) // (1000 - 400) / 2
    expect(r.y).toBe(250) // (800 - 300) / 2
    expect(r.w).toBe(400)
    expect(r.h).toBe(300)
  })

  it('single snip larger than canvas is scaled down', () => {
    const result = packSnips(500, 400, 0, [{ width: 2000, height: 1600, frame: 'none' }])
    expect(result.allFit).toBe(true)
    const r = result.rects[0]!
    expect(r.w).toBeLessThanOrEqual(500)
    expect(r.h).toBeLessThanOrEqual(400)
    expect(r.w / r.h).toBeCloseTo(2000 / 1600, 1)
  })

  it('multiple snips produce no overlaps', () => {
    const snips = [
      { width: 200, height: 150, frame: 'none' as const },
      { width: 200, height: 150, frame: 'none' as const },
      { width: 200, height: 150, frame: 'none' as const },
    ]
    const result = packSnips(1000, 800, 10, snips)
    expect(result.allFit).toBe(true)

    const rects = result.rects.filter((r) => r !== null)
    expect(rects).toHaveLength(3)

    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        const a = rects[i]!
        const b = rects[j]!
        const overlap = a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
        expect(overlap, `rect ${i} overlaps rect ${j}`).toBe(false)
      }
    }
  })

  it('all rects stay within canvas bounds', () => {
    const snips = [
      { width: 300, height: 200, frame: 'none' as const },
      { width: 250, height: 180, frame: 'none' as const },
      { width: 400, height: 300, frame: 'laptop' as const },
    ]
    const result = packSnips(1000, 800, 20, snips)
    expect(result.allFit).toBe(true)
    for (const r of result.rects) {
      if (r === null) continue
      expect(r.x).toBeGreaterThanOrEqual(0)
      expect(r.y).toBeGreaterThanOrEqual(0)
      expect(r.x + r.w).toBeLessThanOrEqual(1000)
      expect(r.y + r.h).toBeLessThanOrEqual(800)
    }
  })

  it('returns allFit:false when canvas is too small for multiple snips', () => {
    // Single-snip always scales to fit; need 2+ snips in a canvas too small
    // for even the minimum 4×4px slot size (interior is 3×3)
    const snips = [
      { width: 1000, height: 1000, frame: 'none' as const },
      { width: 1000, height: 1000, frame: 'none' as const },
    ]
    const result = packSnips(3, 3, 0, snips)
    expect(result.allFit).toBe(false)
  })
})
