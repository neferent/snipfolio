const { app, BrowserWindow, ipcMain, shell } = require('electron')
const path = require('node:path')
const { startStaticServer } = require('./staticServer.cjs')

// app.isPackaged is only true once electron-builder has actually packaged
// the app — a plain `electron .` against the static build is NOT packaged,
// so it's not a reliable dev/prod signal. electron:dev sets ELECTRON_DEV=1
// explicitly instead.
const isDev = process.env.ELECTRON_DEV === '1'

// In dev we point at the Nuxt dev server so changes hot-reload. In
// production we serve the static build (`nuxt generate` → .output/public)
// over a local HTTP server rather than loading it via a raw file:// URL.
// This also fixes a real bug: dev mode (localhost:3000) and a raw file://
// load are two completely different, mutually invisible storage origins —
// a project saved in one is simply gone when reopened via the other. Serving
// production over a real http://localhost origin at a fixed port keeps it
// consistent across every launch, so it's a single stable origin whose
// localStorage/IndexedDB (project/snip/image data) reliably persists. See
// staticServer.cjs for why the port must stay fixed.
const DEV_SERVER_URL = process.env.NUXT_DEV_SERVER_URL || 'http://localhost:3000'
const STATIC_ROOT = path.join(__dirname, '..', '.output', 'public')

// Only one instance may run at a time — both because two windows sharing one
// project's local storage would race, and because the static server below
// binds a fixed port that only one process can hold.
const gotSingleInstanceLock = app.requestSingleInstanceLock()
if (!gotSingleInstanceLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}

/** @type {BrowserWindow | null} */
let mainWindow = null

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#ffffff',
    // Dev mode (electron:dev) loads from a different local origin than the
    // real app, with its own separate, non-shared storage — the title makes
    // that visible even before the page's own dev-mode banner loads.
    title: isDev ? 'Snipfolio (Dev — test data only)' : 'Snipfolio',
    icon: path.join(__dirname, '..', 'public', 'icons', 'logo_48.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    show: false,
  })

  mainWindow.once('ready-to-show', () => mainWindow?.show())
  mainWindow.webContents.on('did-fail-load', (_e, code, desc, url) => console.error('[main] did-fail-load:', code, desc, url))

  // Electron syncs the window title to the page's own document.title (which
  // Nuxt sets per-page via useHead) — without this, our dev-mode title above
  // gets overwritten by the first page load. Keep the "(Dev — test data
  // only)" suffix on every title change instead of just the initial one.
  if (isDev) {
    mainWindow.on('page-title-updated', (e, title) => {
      if (title.includes('Dev — test data only')) return
      e.preventDefault()
      mainWindow?.setTitle(`${title} (Dev — test data only)`)
    })
  }

  if (isDev) {
    mainWindow.loadURL(DEV_SERVER_URL)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    const port = await startStaticServer(STATIC_ROOT)
    mainWindow.loadURL(`http://localhost:${port}`)
  }

  // Anything that would navigate to an external site (links, target=_blank)
  // opens in the OS browser instead of inside the app window.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

if (gotSingleInstanceLock) {
  app.whenReady().then(createWindow)

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  // --- Capture IPC ---
  // Filled in by ./capture.cjs (Phase 3) — registered here so main.cjs stays
  // the single place that owns app/window lifecycle.
  require('./capture.cjs').registerCaptureHandlers(ipcMain)
}
