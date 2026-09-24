// Local screenshot capture, running in Electron's main process. Ported from
// ~/snipfolio-screenshotter's Playwright-based takeScreenshot() — same
// viewport widths, same scroll-container/lazy-load handling, same full-page
// capture behavior. Dropped relative to that service (irrelevant to an
// in-process call from the app's own UI on the user's own machine): the
// HMAC request signing, bearer token auth, SSRF/private-IP URL checks, and
// the Express rate limiter / concurrency counter. Kept: the per-capture
// timeout deadline and the page-height clip, since a pathological page can
// still hang or balloon memory regardless of who's asking.
const { chromium } = require('playwright')

const VIEWPORT_WIDTHS = { desktop: 1440, tablet: 768, mobile: 390 }
const CAPTURE_TIMEOUT_MS = 90_000
const MAX_PAGE_HEIGHT = 20_000
const MAX_DEVICE_SCALE_FACTOR = 3

let browserPromise = null

function getBrowser() {
  if (!browserPromise) {
    browserPromise = chromium.launch({ channel: 'chromium' }).catch((err) => {
      browserPromise = null
      throw err
    })
  }
  return browserPromise
}

// Some pages put all their content in a scrollable inner container
// (e.g. `<div style="overflow-y: auto">`) instead of letting <body>
// scroll, which leaves document.scrollHeight stuck at the viewport
// height. fullPage screenshots are bound to document height, so they'd
// only capture the first viewport. Find the scroll container with the
// largest overflow and strip the height/overflow constraints on it and
// its ancestors so the document expands to the full content height.
async function expandScrollContainers(page) {
  await page.evaluate(() => {
    let target = null
    let maxOverflow = 0
    document.querySelectorAll('*').forEach((el) => {
      const overflow = el.scrollHeight - el.clientHeight
      if (overflow > maxOverflow && el.clientHeight > 0) {
        const style = getComputedStyle(el)
        if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
          maxOverflow = overflow
          target = el
        }
      }
    })
    let el = target
    while (el) {
      el.style.setProperty('overflow', 'visible', 'important')
      el.style.setProperty('height', 'auto', 'important')
      el.style.setProperty('max-height', 'none', 'important')
      el = el.parentElement
    }
  })
}

// Scrolls to the bottom of the page in steps to trigger lazy-loaded
// content (images, sections loaded via IntersectionObserver), then
// returns to the top so the full-page screenshot starts from the origin.
async function scrollPage(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      const distance = 400
      const delay = 150
      const timer = setInterval(() => {
        const { scrollHeight } = document.body
        window.scrollBy(0, distance)
        if (window.scrollY + window.innerHeight >= scrollHeight) {
          clearInterval(timer)
          resolve()
        }
      }, delay)
    })
  })
  await page.evaluate(() => window.scrollTo(0, 0))
}

// requestId -> { context } for in-flight captures, so a cancel request can
// close the context and force any in-flight Playwright call to reject.
const active = new Map()

// onProgress(event, data) is called at each capture phase — 'started' once
// the page begins navigating, 'measured' once page height is known.
async function takeScreenshot(requestId, url, viewport, deviceScaleFactor, onProgress) {
  const width = VIEWPORT_WIDTHS[viewport]
  if (!width) throw new Error('viewport must be desktop, tablet, or mobile')
  const dsf = Number.isFinite(deviceScaleFactor) && deviceScaleFactor >= 1 && deviceScaleFactor <= MAX_DEVICE_SCALE_FACTOR
    ? deviceScaleFactor
    : 1

  let context, page
  let timedOut = false
  const deadline = setTimeout(() => {
    timedOut = true
    if (context) context.close().catch(() => {})
  }, CAPTURE_TIMEOUT_MS)

  try {
    const browser = await getBrowser()
    context = await browser.newContext({ viewport: { width, height: 800 }, deviceScaleFactor: dsf })
    active.set(requestId, { context })
    page = await context.newPage()
    onProgress('started', {})
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 })
    await expandScrollContainers(page)
    const scrollHeight = await page.evaluate(() => document.body.scrollHeight)
    onProgress('measured', { scrollHeight })
    await scrollPage(page)
    await page.waitForTimeout(500)
    const captureHeight = Math.min(scrollHeight, MAX_PAGE_HEIGHT)
    const png = await page.screenshot(
      scrollHeight > MAX_PAGE_HEIGHT
        ? { clip: { x: 0, y: 0, width, height: captureHeight }, timeout: 60_000 }
        : { fullPage: true, timeout: 60_000 },
    )
    return png
  } catch (err) {
    if (timedOut) throw new Error('Capture timed out')
    throw err
  } finally {
    clearTimeout(deadline)
    active.delete(requestId)
    if (page) await page.close().catch(() => {})
    if (context) await context.close().catch(() => {})
  }
}

function registerCaptureHandlers(ipcMain) {
  ipcMain.handle('capture:run', async (event, { requestId, url, viewport, deviceScaleFactor }) => {
    if (!url || !viewport) throw new Error('url and viewport are required')

    const send = (phase, data) => {
      event.sender.send('capture:progress', { requestId, phase, phaseStartedAt: Date.now(), ...data })
    }

    try {
      const png = await takeScreenshot(requestId, url, viewport, deviceScaleFactor, send)
      return { image: png.toString('base64') }
    } catch (err) {
      // Discard a possibly-crashed browser so the next request gets a fresh one.
      if (err && /Target (page|context|browser) closed|Browser closed/i.test(err.message ?? '')) {
        browserPromise = null
      }
      throw err instanceof Error ? err : new Error('Screenshot failed')
    }
  })

  ipcMain.on('capture:cancel', (_event, requestId) => {
    active.get(requestId)?.context.close().catch(() => {})
  })
}

module.exports = { registerCaptureHandlers }
