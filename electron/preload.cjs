const { contextBridge, ipcRenderer } = require('electron')

/**
 * Renderer-facing capture API. Mirrors the shape of the old
 * `captureViewportSSE()` contract (progress callback + a final
 * { image: base64 } result) so the composables/components calling it don't
 * need structural changes — see app/composables/useUrlCapture.ts.
 *
 * Progress can't ride an ipcRenderer.invoke() response (request/response
 * only), so each call gets a unique requestId: progress events arrive on a
 * shared 'capture:progress' channel tagged with that id, and the final
 * result/error comes back as the resolved/rejected invoke() promise.
 *
 * Returns { promise, cancel() } rather than just a promise, so the caller can
 * cancel an in-flight capture (mirrors the old fetch(..., { signal }) abort).
 */
function captureUrl(url, viewport, deviceScaleFactor, onProgress) {
  const requestId = crypto.randomUUID()

  const onProgressEvent = (_event, payload) => {
    if (payload.requestId !== requestId) return
    const { requestId: _requestId, ...progress } = payload
    onProgress?.(progress)
  }
  ipcRenderer.on('capture:progress', onProgressEvent)

  const promise = ipcRenderer
    .invoke('capture:run', { requestId, url, viewport, deviceScaleFactor })
    .finally(() => {
      ipcRenderer.removeListener('capture:progress', onProgressEvent)
    })

  const cancel = () => ipcRenderer.send('capture:cancel', requestId)

  return { promise, cancel }
}

contextBridge.exposeInMainWorld('snipfolioCapture', {
  captureUrl,
})
