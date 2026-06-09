export function useResizablePanel(defaultWidth: number, options: { min?: number; max?: number; side: 'left' | 'right' } = { side: 'right' }) {
  const width = ref(defaultWidth)
  const min = options.min ?? 150
  const max = options.max ?? 600

  function startResize(e: MouseEvent) {
    e.preventDefault()
    const startX = e.clientX
    const startWidth = width.value

    function onMove(ev: MouseEvent) {
      const delta = ev.clientX - startX
      const next = options.side === 'right' ? startWidth + delta : startWidth - delta
      width.value = Math.min(max, Math.max(min, next))
    }

    function onUp() {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  return { width, startResize }
}
