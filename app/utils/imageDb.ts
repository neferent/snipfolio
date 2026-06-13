const THUMB_W = 640
const THUMB_H = 256

export async function generateThumbnail(img: HTMLImageElement): Promise<string> {
  // Crop to top THUMB_H pixels (scaled), then resize via createImageBitmap —
  // drawing very large source images directly to canvas fails silently in
  // some browsers (e.g. Safari's GPU texture size limit on tall full-page captures).
  const srcH = Math.min(Math.round(THUMB_H * img.naturalWidth / THUMB_W), img.naturalHeight)
  const bitmap = await createImageBitmap(img, 0, 0, img.naturalWidth, srcH, {
    resizeWidth: THUMB_W,
    resizeHeight: THUMB_H,
    resizeQuality: 'medium',
  })
  const canvas = document.createElement('canvas')
  canvas.width = THUMB_W
  canvas.height = THUMB_H
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0)
  bitmap.close()
  return canvas.toDataURL('image/jpeg', 0.8)
}

const DB_NAME = 'snipfolio-images'
const STORE = 'images'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function saveImageToDb(key: string, dataUrl: string): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(dataUrl, key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getImageFromDb(key: string): Promise<string | null> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).get(key)
    req.onsuccess = () => resolve((req.result as string | undefined) ?? null)
    req.onerror = () => reject(req.error)
  })
}

export async function deleteImageFromDb(key: string): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}
