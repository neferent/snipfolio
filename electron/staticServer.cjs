// Serves the static Nuxt build (.output/public) over http://localhost — used
// instead of BrowserWindow.loadFile() (raw file:// URLs) because Chromium
// does not reliably persist localStorage/IndexedDB writes to disk for file://
// origins in this Electron setup (confirmed: writes succeed in-session but
// are gone on the next launch). A real http:// origin behaves like any
// normal persistent site origin.
const http = require('node:http')
const fs = require('node:fs')
const path = require('node:path')

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

// Fixed port so the app's origin (http://localhost:PORT) — and therefore its
// localStorage/IndexedDB — is identical across every launch. A random port
// would reintroduce the exact persistence problem this server exists to fix:
// origins are scheme+host+PORT, so a different port each run means different,
// disconnected storage each run. Paired with app.requestSingleInstanceLock()
// in main.cjs so nothing else on the machine can be holding this port when we
// need it.
const FIXED_PORT = 45677

/** Starts the static server and resolves with the port it's listening on. */
function startStaticServer(rootDir) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent((req.url || '/').split('?')[0])
      let filePath = path.join(rootDir, urlPath)

      // Guard against escaping rootDir via '..' in the request path.
      if (!filePath.startsWith(rootDir)) {
        res.writeHead(403)
        res.end()
        return
      }

      fs.stat(filePath, (err, stat) => {
        if (err || !stat.isFile()) {
          // SPA fallback: unknown paths serve index.html (hash-mode routing
          // means the router handles the actual route client-side).
          filePath = path.join(rootDir, 'index.html')
        }
        const ext = path.extname(filePath)
        res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' })
        fs.createReadStream(filePath).pipe(res)
      })
    })

    server.on('error', reject)
    server.listen(FIXED_PORT, '127.0.0.1', () => {
      resolve(server.address().port)
    })
  })
}

module.exports = { startStaticServer }
