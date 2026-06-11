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

## Mental map (pages/views)

| View | Aliases | Route | File | Key components |
|------|---------|-------|------|-----------------|
| Landing page | — | `/` | `pages/index.vue` | — |
| Dashboard | Project list | `/dashboard` | `pages/dashboard.vue` | `NewProjectModal.vue` |
| Snipper | Snip tool, Snip editor | `/project/[id]` | `pages/project/[id]/index.vue` | `SnipTool.vue` (+ `SnipOverlay`, `SnipList`, `SnipPanel`) |
| Composer | Composition tool | `/project/[id]/compose/[compositionId]` | `pages/project/[id]/compose/[compositionId].vue` | `CompositionEditor.vue` (+ `FreeformEditor`/`CollageLayout`, `ComposerToolbar`) |

### Page features

#### Dashboard (`pages/dashboard.vue`)
- **Project list** — grid of project cards (thumbnail preview, name, updated date, delete button), loading skeleton, and empty state. Inline in `dashboard.vue`.
- **New Project Modal** — `components/NewProjectModal.vue`. Create a blank project, or enter a URL to auto-capture desktop/mobile screenshots (`/api/screenshot`) and auto-generate Laptop / Laptop+Phone compositions via `useCompositions`.
- Also handles: auth header (sign in/out, manage subscription), Pro upsell modal (free plan project limit), delete-confirm modal.

#### Snipper (`pages/project/[id]/index.vue` → `SnipTool.vue`)
- **Snip list** — top section of the left sidebar (`SnipList.vue`). Lists all snips, grouped by source when there's more than one source; shows thumbnail, dimensions, snap-frame badge (Desktop/Tablet/Mobile), and delete.
- **Composition list** — bottom section of the left sidebar (`SnipList.vue`, "Compositions" group). Links to each composition's Composer route; "New" button opens `NewCompositionModal.vue`.
- **Source list** — tab bar above the viewport (inline in `SnipTool.vue`, ~line 27-77). One tab per source image — switch active source, rename label, remove source, see dimensions.
- **Snip toolbar** — viewport toolbar (inline in `SnipTool.vue`, ~line 80-132). Draw-snip tool indicator, zoom controls/input, fit-to-width, export dropdown (`ExportPickerModal.vue` / export-all-raw).
- **Add source modal** — inline `AppModal` in `SnipTool.vue` (~line 201+). Upload a screenshot (`ScreenshotDropzone.vue`) or capture from a URL (`UrlCaptureModal.vue`) to add another source.
- **Snip properties** — right sidebar (`SnipPanel.vue`). Selected snip's label, width/height, x/y position, and snap-frame.

#### Composer (`pages/project/[id]/compose/[compositionId].vue` → `CompositionEditor.vue`)
For Freeform/Laptop/Laptop+Phone types, the slot list, add-snip, and toolbar below live in `FreeformEditor.vue`. Auto-Collage uses a different layout (`CollageLayout.vue` + `CompositionCanvas.vue`) without slots/toolbar. Both layouts share the right-sidebar `CompositionSettingsPanel.vue`.
- **Slots** — left sidebar slot list in `FreeformEditor.vue` (~line 13-80). Shows each placed snip in z-order (top = front), with reorder via drag, frame-mismatch warnings, and remove.
- **Add Snip** — below the slot list in `FreeformEditor.vue` (~line 85-100). Picks an unplaced snip from the project and adds it as a new slot via `addSnip(snip)`.
- **Composition toolbar** — `ComposerToolbar.vue`, rendered above the canvas in `FreeformEditor.vue` (~line 117-130). Alignment (left/center/right/top/middle/bottom) and z-order (forward/back/front/bottom) for the selected slot, plus delete.
- **Settings > Background** — `BackgroundControls.vue`, inside `CompositionSettingsPanel.vue`. Background color/gradient/image config.
- **Platform presets** — `PlatformPresets.vue`, inside `CompositionSettingsPanel.vue` below background controls. Pro-gated accordion of platform-specific output sizes (uses `icons/Logo*.vue`).
- **Output** — output-size section inside `CompositionSettingsPanel.vue`. Preset size buttons + custom width/height inputs.
- **Export modal** — `ExportPickerModal.vue`, triggered by the "Export PNG" button in `CompositionSettingsPanel.vue` (`doExport`). Handles export format/size selection and download; also gates non-Pro export limits.

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
| `PlatformPresets.vue` | Accordion of platform-specific size presets (Pro feature) |

### UI (`components/ui/`)
| File | Role |
|------|------|
| `AppModal.vue` | Base modal shell |
| `AppDropdown.vue` / `AppDropdownItem.vue` | Dropdown menu primitives |
| `AppColorPicker.vue` | Color picker input |
| `AppTooltip.vue` | Hover tooltip primitive |
| `ZoomControls.vue` | Zoom in/out/reset controls for the snip viewport |
| `SaveStatus.vue` | Shows save/sync status indicator |
| `WatermarkToggle.vue` | Toggle for preview watermark (free plan) |

### Other
| File | Role |
|------|------|
| `NewProjectModal.vue` | Modal to create a new project |
| `icons/Logo*.vue` | Platform logo icons (App Store, Google Play, Product Hunt, Steam) used in `PlatformPresets` |
| `frames/frameUtils.ts` | Shared frame utilities: `FrameDrawResult` interface, `applyScaledShadow` |

## Tests

Unit tests live in `tests/` and run with Vitest:
- `stores.test.ts` — Pinia store unit tests (auth, project, snips, compositions, sources)
- `useCompositions.test.ts` — composition creation logic
- `useSnips.test.ts` — snip CRUD
- `usePlan.test.ts` — plan/access checks
- `justifiedLayout.test.ts`, `packSnips.test.ts` — algorithm tests

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
