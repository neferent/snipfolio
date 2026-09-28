# Snipfolio

A Nuxt 4 app for clipping regions ("snips") from a screenshot, then composing them into export-ready images with device frames, captions, and backgrounds.

Purely local, single-user app — no accounts, no backend, no Supabase. All state lives on-device (IndexedDB via `imageDb.ts`, `localStorage` for the stable local user id). Ships both as a statically-generated web build and as an Electron desktop app (`electron/`). The only outbound network call is URL-capture, which hits an external fly.io screenshotter service (see `featureFlags.ts`) — everything else is fully client-side.

## Stack

- **Nuxt 4** + **Vue 3** (Composition API, `<script setup>`)
- **Pinia** for state (`stores/`)
- **Tailwind CSS v4**
- **Electron** for the desktop build (`electron/`)
- **pnpm** — use `pnpm dev` to run

## Key concepts

- **Snip** — a rectangular crop region on the source image (`x, y, width, height` in natural image pixels, not zoomed pixels). Defined in `types/index.ts`.
- **Source image** — loaded via `ScreenshotDropzone`, stored in `projectStore.sourceImage` (an `HTMLImageElement`). Natural dimensions are the coordinate system for all snip data.
- **Composition** — one or more snips arranged with a background, device frames, and optional captions for export.

## Mental map (pages/views)

| View | Aliases | Route | File | Key components |
|------|---------|-------|------|-----------------|
| Root | — | `/` | `pages/index.vue` | Redirect-only, unconditional: always `/dashboard` (no auth to branch on) |
| Dashboard | Studio | `/dashboard` | `pages/dashboard.vue` | `StudioFrame.vue` (+ `BackgroundControls`, `CaptionControls`) |
| Projects | Project list | `/projects` | `pages/projects.vue` | `NewProjectModal.vue` |
| Snipper | Snip tool, Snip editor, Advanced editor | `/advanced/[id]` | `pages/advanced/[id]/index.vue` | `SnipTool.vue` (+ `SnipOverlay`, `SnipList`, `SnipPanel`) |
| Composer | Composition tool, Advanced editor | `/advanced/[id]/compose/[compositionId]` | `pages/advanced/[id]/compose/[compositionId].vue` | `CompositionEditor.vue` (+ `FreeformEditor`/`CollageLayout`, `ComposerToolbar`) |

`/dashboard` (Studio) is the default landing page. There's no auth anywhere in the app (no `app/middleware/`) — every route is open. `/dashboard`'s header has a "Projects" dropdown (recent projects + link to `/projects`) and an "Advanced Editor" button (→ `/projects`) for the snip/composition-based flow. `/projects`, `/advanced/[id]`, and `/advanced/[id]/compose/[compositionId]` link back to each other via "Projects" breadcrumbs, not "Dashboard".

### Page features

#### Dashboard / Studio (`pages/dashboard.vue`)
Standalone, project-free flow: capture one or more device viewports from a URL directly onto a single output canvas, frame them, and export — no source/snip/composition records involved. This is the app's default landing page.
- **Capture form** — no standalone panel; lives in the artboard's empty-state card (device toggles, URL input, capture button, per-device progress/error state via `captureState`) until the first device image lands (`hasAnyCapture`).
- **Artboard** — one `<canvas>` renders background + every active device's frame (`renderCanvas`); one `StudioFrame.vue` overlay per active device handles drag/resize/scroll interaction on top of it.
- **Default layouts** — when 2+ devices are active, `arrangeOverlapGroup` (~line 145-215) auto-positions them in the classic "biggest device centered, smaller ones in front overlapping its edges" mockup style. Tuning knobs (`UNIT_HEIGHT`, `OVERLAP_FRACTION`, `OVERLAP_SIDE`, `marginRatio`) are documented in a comment directly above that function — start there before touching the positioning math.
- **Sidebar** — Frame (device tabs, color, center), Canvas (output size inputs + presets), Caption, Background, Export.
- **Header** — Projects dropdown (recent projects, "View all projects" link) and "Advanced Editor" button, both leading into the project-based flow below.

#### Projects (`pages/projects.vue`)
- **Project list** — grid of project cards (thumbnail preview, name, updated date, delete button), loading skeleton, and empty state. Inline in `projects.vue`.
- **New Project Modal** — `components/NewProjectModal.vue`. Create a blank project, or enter a URL to auto-capture desktop/mobile screenshots (via the fly.io screenshotter, `useUrlCapture`) and auto-generate Laptop / Laptop+Phone compositions via `useCompositions`.
- Also handles: delete-confirm modal.

#### Snipper (`pages/advanced/[id]/index.vue` → `SnipTool.vue`)
- **Snip list** — top section of the left sidebar (`SnipList.vue`). Lists all snips, grouped by source when there's more than one source; shows thumbnail, dimensions, snap-frame badge (Desktop/Tablet/Mobile), and delete.
- **Composition list** — bottom section of the left sidebar (`SnipList.vue`, "Compositions" group). Links to each composition's Composer route; "New" button opens `NewCompositionModal.vue`.
- **Source list** — tab bar above the viewport (inline in `SnipTool.vue`, ~line 27-77). One tab per source image — switch active source, rename label, remove source, see dimensions.
- **Snip toolbar** — viewport toolbar (inline in `SnipTool.vue`, ~line 80-132). Draw-snip tool indicator, zoom controls/input, fit-to-width, export dropdown (`ExportPickerModal.vue` / export-all-raw).
- **Add source modal** — inline `AppModal` in `SnipTool.vue` (~line 201+). Upload a screenshot (`ScreenshotDropzone.vue`) or capture from a URL (`UrlCaptureModal.vue`) to add another source.
- **Snip properties** — right sidebar (`SnipPanel.vue`). Selected snip's label, width/height, x/y position, and snap-frame.

#### Composer (`pages/advanced/[id]/compose/[compositionId].vue` → `CompositionEditor.vue`)
For Freeform/Laptop/Laptop+Phone types, the slot list, add-snip, and toolbar below live in `FreeformEditor.vue`. Auto-Collage uses a different layout (`CollageLayout.vue` + `CompositionCanvas.vue`) without slots/toolbar. Both layouts share the right-sidebar `CompositionSettingsPanel.vue`.
- **Slots** — left sidebar slot list in `FreeformEditor.vue` (~line 13-80). Shows each placed snip in z-order (top = front), with reorder via drag, frame-mismatch warnings, and remove.
- **Add Snip** — below the slot list in `FreeformEditor.vue` (~line 85-100). Picks an unplaced snip from the project and adds it as a new slot via `addSnip(snip)`.
- **Composition toolbar** — `ComposerToolbar.vue`, rendered above the canvas in `FreeformEditor.vue` (~line 117-130). Alignment (left/center/right/top/middle/bottom) and z-order (forward/back/front/bottom) for the selected slot, plus delete.
- **Settings > Background** — `BackgroundControls.vue`, inside `CompositionSettingsPanel.vue`. Background color/gradient/image config.
- **Platform presets** — `PlatformPresets.vue`, inside `CompositionSettingsPanel.vue` below background controls. Free-for-everyone accordion of platform-specific output sizes (uses `icons/Logo*.vue`).
- **Output** — output-size section inside `CompositionSettingsPanel.vue`. Preset size buttons + custom width/height inputs.
- **Export modal** — `ExportPickerModal.vue`, triggered by the "Export PNG" button in `CompositionSettingsPanel.vue` (`doExport`). Handles export format/size selection and download.

## Component map

### Snip (`components/snip/`)
| File | Role |
|------|------|
| `SnipTool.vue` | Scrollable viewport + draw-new-snip logic |
| `SnipOverlay.vue` | Renders snip boxes, handles move + resize |
| `SnipList.vue` | Left sidebar list of snips |
| `SnipPanel.vue` | Right sidebar — selected snip properties |
| `SnipThumbnail.vue` | Small cropped preview of a snip |
| `ScreenshotDropzone.vue` | Initial drop/upload zone for the source image |
| `UrlCaptureModal.vue` | "Compose from URL" — capture a screenshot from a web page |
| `NewCompositionModal.vue` | Modal to create a new composition from selected snips |
| `ExportPickerModal.vue` | Modal for choosing export format/size and downloading |

### Composition (`components/composition/`)
| File | Role |
|------|------|
| `CompositionEditor.vue` | Composition canvas + controls (host for editor types) |
| `FreeformEditor.vue` | Freeform/Laptop/Laptop+Phone canvas — drag, resize, z-order, align |
| `CollageLayout.vue` | Auto-Collage controls (gap slider, frame-not-supported notice) |
| `CompositionCanvas.vue` | Canvas wrapper that renders the live composition via `useCanvasRenderer` |
| `CompositionPreview.vue` | Static canvas preview of a composition (e.g. for thumbnails/lists) |
| `ComposerToolbar.vue` | Top toolbar — alignment, ordering, and editing actions |
| `CompositionSettingsPanel.vue` | Shared right-sidebar "Settings" panel (background, platform presets, output size, name, export) — used by both `FreeformEditor` and `CompositionEditor`'s Auto-Collage layout |
| `BackgroundControls.vue` | Background color/gradient/image controls |
| `CaptionControls.vue` | Caption text/style controls |
| `PlatformPresets.vue` | Accordion of platform-specific size presets (free for everyone) |

### UI (`components/ui/`)
| File | Role |
|------|------|
| `AppModal.vue` | Base modal shell |
| `AppDropdown.vue` / `AppDropdownItem.vue` | Dropdown menu primitives |
| `AppColorPicker.vue` | Color picker input |
| `AppTooltip.vue` | Hover tooltip primitive |
| `ZoomControls.vue` | Zoom in/out/reset controls for the snip viewport |
| `SaveStatus.vue` | Shows save/sync status indicator |
| `WatermarkToggle.vue` | Toggle for preview watermark |

### Other
| File | Role |
|------|------|
| `NewProjectModal.vue` | Modal to create a new project |
| `icons/Logo*.vue` | Platform logo icons (App Store, Google Play, Product Hunt, Steam) used in `PlatformPresets` |
| `frames/frameUtils.ts` | Shared frame utilities: `FrameDrawResult` interface, `applyScaledShadow` |

## Tests

Unit tests live in `tests/` and run with Vitest:
- `stores.test.ts` — Pinia store unit tests (auth store just holds a stable local anonymous id; project, snips, compositions, sources)
- `useCompositions.test.ts` — composition creation logic
- `useSnips.test.ts` — snip CRUD
- `useExport.test.ts` — export logic
- `justifiedLayout.test.ts` — algorithm tests

Run with `pnpm test`.

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

When snapping is active the selection box turns emerald green and shows a label pill ("Desktop" / "Mobile").

### Auto-scroll during draw
`SnipTool.vue` runs a `requestAnimationFrame` loop while a draw is in progress. If the mouse is within 60px of any viewport edge it scrolls at up to 12px/frame (proportional to proximity). After each scroll tick it recomputes the draw rect from the last known mouse position so the rect grows to match the newly revealed image area.

### Event handling pattern
Move and resize use `window` mousemove/mouseup listeners (added on mousedown, removed on mouseup) so drags aren't interrupted if the mouse leaves the viewport. Draw follows the same pattern — do not bind `@mousemove` on the viewport div for drag tracking.
