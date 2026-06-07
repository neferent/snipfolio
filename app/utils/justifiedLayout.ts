export function partitionIntoRows(aspects: number[], R: number): number[][] {
  const n = aspects.length
  if (R >= n) return aspects.map((_, i) => [i])
  if (R === 1) return [aspects.map((_, i) => i)]

  const target = aspects.reduce((s, a) => s + a, 0) / R
  const rows: number[][] = []
  let row: number[] = []
  let rowSum = 0

  for (let i = 0; i < n; i++) {
    row.push(i)
    rowSum += aspects[i]!

    const rowsLeft = R - rows.length - 1
    const itemsLeft = n - i - 1

    if (rowsLeft > 0 && itemsLeft >= rowsLeft && rowSum >= target) {
      rows.push([...row])
      row = []
      rowSum = 0
    }
  }

  if (row.length > 0) rows.push(row)
  return rows
}

export function computeJustifiedLayout(
  W: number,
  H: number,
  gap: number,
  aspects: number[],
  areas: number[],
): Array<{ x: number; y: number; w: number; h: number }> {
  const pad = gap
  const iW = W - pad * 2
  const iH = H - pad * 2
  const n = aspects.length

  if (n === 0) return []
  if (n === 1) return [{ x: pad, y: pad, w: iW, h: iH }]

  const order = [...Array(n).keys()].sort((a, b) => areas[b]! - areas[a]!)
  const sortedAspects = order.map((i) => aspects[i]!)

  let bestRows: number[][] = []
  let bestScore = Infinity

  for (let R = 1; R <= n; R++) {
    const rows = partitionIntoRows(sortedAspects, R)
    const totalH =
      rows.reduce((s, row) => {
        const sumA = row.reduce((a, j) => a + sortedAspects[j]!, 0)
        return s + (iW - gap * (row.length - 1)) / sumA
      }, 0) +
      gap * (rows.length - 1)

    const score = totalH > iH ? totalH / iH : iH / totalH
    if (score < bestScore) {
      bestScore = score
      bestRows = rows
    }
  }

  const naturalH = bestRows.map((row) => {
    const sumA = row.reduce((s, j) => s + sortedAspects[j]!, 0)
    return (iW - gap * (row.length - 1)) / sumA
  })

  const totalNatH = naturalH.reduce((s, h) => s + h, 0) + gap * (bestRows.length - 1)
  const vScale = iH / totalNatH

  const rects: Array<{ x: number; y: number; w: number; h: number }> = new Array(n)

  let yAcc = pad
  for (let r = 0; r < bestRows.length; r++) {
    const row = bestRows[r]!
    const rowH = naturalH[r]! * vScale
    const rowHInt = r < bestRows.length - 1 ? Math.round(rowH) : pad + iH - yAcc

    const sumA = row.reduce((s, j) => s + sortedAspects[j]!, 0)
    const rowGaps = gap * (row.length - 1)

    let xAcc = pad
    for (let c = 0; c < row.length; c++) {
      const j = row[c]!
      const wFloat = (sortedAspects[j]! / sumA) * (iW - rowGaps)
      const wInt = c < row.length - 1 ? Math.round(wFloat) : pad + iW - xAcc
      rects[order[j]!] = { x: xAcc, y: yAcc, w: wInt, h: rowHInt }
      xAcc += wInt + gap
    }
    yAcc += rowHInt + gap
  }

  return rects
}
