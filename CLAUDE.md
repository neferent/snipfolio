# Snipfolio

A Nuxt 4 app for clipping regions ("snips") from a screenshot, then composing them into export-ready images with device frames, captions, and backgrounds.

## Stack

- **Nuxt 4** + **Vue 3** (Composition API, `<script setup>`)
- **Pinia** for state (`stores/`)
- **Tailwind CSS v4**
- **Supabase** for auth + storage
- **pnpm** — use `pnpm dev` to run

## Key concepts

- **Snip** — a rectangular crop region on the source image (`x, y, width, height` in natural image pixels, not zoomed pixels). Defined in `types/index.ts`.
- **Source image** — loaded via `ScreenshotDropzone`, stored in `projectStore.sourceImage` (an `HTMLImageElement`). Natural dimensions are the coordinate system for all snip data.
- **Composition** — one or more snips arranged with a background, device frames, and optional captions for export.

## Component map

| File | Role |
|------|------|
| `SnipTool.vue` | Scrollable viewport + draw-new-snip logic |
| `SnipOverlay.vue` | Renders snip boxes, handles move + resize |
| `SnipList.vue` | Left sidebar list of snips |
| `SnipPanel.vue` | Right sidebar — selected snip properties |
| `CompositionEditor.vue` | Composition canvas + controls |

## Snip drawing rules

Drawing, moving, and resizing all operate in **natural image pixel coordinates**. The viewport applies a CSS `transform: scale(zoom)` — divide any client-pixel delta by `zoom` before storing.

### Bounds
All three operations are clamped to the source image bounds (`[0, naturalWidth] × [0, naturalHeight]`):
- **Draw**: both the anchor point (`drawStart`) and the live cursor are clamped before computing the rect.
- **Move**: position clamped so the snip stays fully inside (`max(0, …)` and `imageWidth - snip.width`).
- **Resize**: each edge clamped to its boundary while keeping the opposite (anchored) edge fixed. Min size 20×20px.

### Aspect-ratio snapping
Snap threshold: ±20% of ratio, minimum 60px on either side.
- **~3034:1964 (laptop)** — snaps height to `width / (3034.7/1964.07)` to match laptop3.svg screen area
- **9:16 (phone)** — snaps width to `height × (9/16)`

Snapping applies during **draw** (all handles) and **resize** (corner handles only — edge-only handles don't snap to avoid moving the perpendicular edge unexpectedly).

When snapping is active the selection box turns emerald green and shows a label pill ("💻 Laptop" / "📱 Phone").

### Auto-scroll during draw
`SnipTool.vue` runs a `requestAnimationFrame` loop while a draw is in progress. If the mouse is within 60px of any viewport edge it scrolls at up to 12px/frame (proportional to proximity). After each scroll tick it recomputes the draw rect from the last known mouse position so the rect grows to match the newly revealed image area.

### Event handling pattern
Move and resize use `window` mousemove/mouseup listeners (added on mousedown, removed on mouseup) so drags aren't interrupted if the mouse leaves the viewport. Draw follows the same pattern — do not bind `@mousemove` on the viewport div for drag tracking.
