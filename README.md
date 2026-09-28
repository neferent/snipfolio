# Snipfolio

A desktop app for turning screenshots into polished, export-ready mockups — clip regions ("snips") from a screenshot, then compose them with device frames, captions, and backgrounds. Also has a one-shot Studio mode: paste a URL, capture it in one or more device viewports, and export a mockup without any project setup.

Free to use. If you find it useful, tips are appreciated (see below) — but there's no paywall or account required.

## Features

- **Studio** — paste a URL, capture Desktop/Tablet/Mobile/Browser viewports directly, arrange them with drag/resize, and export — no project or account needed.
- **Snipper** — crop precise regions out of a screenshot, with aspect-ratio snapping to common device shapes (laptop, phone).
- **Compositions** — arrange one or more snips with device frames (laptop, tablet, phone, browser), backgrounds (solid/gradient/image), and captions.
- **Auto-Collage** — automatically lay out multiple snips in a justified grid.
- **Platform presets** — common output sizes for the App Store, Google Play, Product Hunt, Steam, etc.
- Runs as a native desktop app (macOS/Windows/Linux via Electron) — no data leaves your machine except when you explicitly capture a URL.

## Privacy

Snipfolio is a purely local, single-user app — no accounts, no backend server, no analytics. All your projects, screenshots, and compositions are stored on your own device. The only network request the app makes is capturing a screenshot from a URL you provide, which runs through a local headless-browser instance.

## Getting started

Requires [Node.js](https://nodejs.org) and [pnpm](https://pnpm.io).

```sh
pnpm install
pnpm dev            # run in a browser at localhost:3000
pnpm electron:dev    # run as a desktop app with hot reload
```

### Building the desktop app

```sh
pnpm electron:pack   # unpacked build, for quick local testing
pnpm electron:build  # produces installers (.dmg/.zip, .exe, .AppImage)
```

### Tests

```sh
pnpm test
```

## Tech stack

Nuxt 4, Vue 3, Pinia, Tailwind CSS v4, Electron.

## A note on how this was built

This project was built with the help of AI coding tools (Claude Code). It wasn't generated wholesale from a prompt — every feature was designed, directed, and reviewed by a human engineer, iterating piece by piece, with the AI writing code under close supervision rather than working independently.

## Support

Snipfolio is free and has no plans to charge for it. If you'd like to support development, [tips are welcome](#) <!-- TODO: add tip link -->.

## License

GPLv3 — see [LICENSE](./LICENSE). Copyright (C) 2026 Edward Terry (neferent). Forks and redistributions must stay open source under the same license.
