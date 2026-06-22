# Mobile Adaptation Plan for Snipfolio

## Context

The app was tested on a mobile device and works better than expected, but has no responsive infrastructure. All three-panel layouts (Snipper, Composer) are desktop-only with mouse-dependent interactions. The goal is to make mobile a first-class experience focused on the **capture → compose → export** workflow, while leaving detailed snip drawing and freeform slot positioning as desktop features.

**Approach**: Responsive enhancement — same routes, same components, layout adapts via `useIsMobile` + Tailwind breakpoints. Sidebars become bottom sheets on mobile. Toolbars become floating bottom bars.

---

## Phase 0: Foundation

### 0a. `useIsMobile` composable
**Create** `app/composables/useIsMobile.ts` — wraps `useMediaQuery('(max-width: 768px)')` from `@vueuse/core` (already installed). Returns a single `Ref<boolean>`. All pages are `ssr: false` so no hydration concern.

### 0b. `AppBottomSheet.vue`
**Create** `app/components/ui/AppBottomSheet.vue` — the core mobile UI primitive.

- Props: `open`, `snapPoints` (peek/half/full), `peekHeight`, `title`
- Touch-gesture driven: swipe handle to snap between positions, velocity-based dismiss
- `fixed bottom-0` with `Teleport to="body"`, backdrop overlay, rounded top corners
- Scroll containment: inner content scrolls when sheet is full; swipe-down from scroll-top moves sheet
- GPU-accelerated via `transform: translateY()`

### 0c. Viewport meta + CSS utilities
**Modify** `nuxt.config.ts` — add `maximum-scale=1, user-scalable=no, viewport-fit=cover` to prevent browser pinch-zoom conflicting with custom zoom.

**Modify** `app/assets/css/main.css` — add:
- Tailwind v4 custom variant: `@custom-variant --mobile (max-width: 768px)`
- Safe-area utility: `@utility pb-safe { padding-bottom: env(safe-area-inset-bottom, 0px) }`
- Touch-action rules for viewports

---

## Phase 1: Dashboard

**Modify** `app/pages/dashboard.vue`

- **Header**: On mobile, collapse auth items (email, badge, manage-sub, sign-out) behind a hamburger/menu button. Keep logo + "New project" visible.
- **Project cards**: Replace hover-revealed delete/rename with an always-visible `...` menu button on mobile (hover doesn't exist on touch).
- **Grid**: Already responsive — no changes needed.

---

## Phase 2: Snipper

The three-panel layout becomes: viewport fills screen, sidebars → bottom sheets, toolbar → floating bottom bar.

### 2a. Layout restructure (`SnipTool.vue`)
- Gate left sidebar (`SnipList`) and right sidebar (`SnipPanel`) with `v-if="!isMobile"`
- Render mobile variants inside `AppBottomSheet` instances
- Center viewport takes full width on mobile

### 2b. Floating bottom bar
**Create** `app/components/snip/SnipToolbarMobile.vue`

Frosted-glass bar fixed to bottom with safe-area padding. Contains:
- **Snips** button (opens SnipList sheet, shows count badge)
- **Source** switcher (compact dropdown)
- **Add Source** button
- **Export** button (prominent, accent-colored)

Omits: draw tool (desktop-only), zoom controls (replaced by pinch), grid toggle.

### 2c. Touch interactions (`SnipTool.vue`, `SnipOverlay.vue`)
- **Pinch-to-zoom**: Two-finger distance tracking → feeds into existing `zoom` ref
- **Two-finger pan**: Scrolls the viewport
- **Tap snip to select**: Opens SnipPanel bottom sheet. Replaces mousedown-to-move.
- **Snip drawing disabled**: `onMouseDown` draw handler returns early if mobile
- **Resize handles hidden**: On mobile, snip overlay shows selection ring only, no handles

### 2d. SnipList/SnipPanel mobile mode
Add `mobile?: boolean` prop to both components. When true:
- Strip sidebar wrapper (fixed width, border, resize handle)
- Render as plain content blocks inside the bottom sheet
- SnipPanel bottom sheet auto-opens when a snip is selected

---

## Phase 3: Composer

Same bottom-sheet pattern as Snipper, applied to both Freeform and Auto-Collage layouts.

### 3a. Layout restructure (`FreeformEditor.vue`, `CompositionEditor.vue`)
- Gate left sidebar (layers) and right sidebar (settings) with `v-if="!isMobile"`
- Render in bottom sheets on mobile
- Canvas fills screen

### 3b. Floating bottom bar
**Create** `app/components/composition/ComposerToolbarMobile.vue`

- **Freeform**: Layers button, Settings button, simplified "Center" alignment, **Export** (prominent)
- **Auto-collage**: Settings button, gap slider inline, **Export** (prominent)

Omits: 6 individual alignment buttons, 4 z-order buttons, grid, manual zoom.

### 3c. Simplified slot interaction (freeform, mobile)
- Tap to select a slot (shows selection ring)
- Selected-slot actions available in toolbar: Center, Delete, frame picker
- Drag-to-move and corner-resize disabled on mobile
- Canvas pinch-to-zoom via same touch pattern as Snipper

### 3d. Settings panel mobile reorder (`CompositionSettingsPanel.vue`)
When in bottom sheet, reorder for quick access:
1. **Export PNG** button (visible in peek state)
2. Copy to clipboard
3. Background controls (collapsed)
4. Output size presets (collapsed)
5. Platform presets, name (collapsed)

---

## Phase 4: Capture-First Mobile Flow

**Modify** `app/components/NewProjectModal.vue`

- On mobile, show "Capture & Compose" card first (above "Blank")
- Larger URL input, bigger tap targets
- After capture navigates to composer, the full-screen canvas + prominent Export button creates the ideal quick flow

The existing capture pipeline (URL → screenshot → auto-snip → auto-compose → navigate to composition) already serves this "capture → compose → export" workflow. No new routes needed.

---

## Phase 5: Polish

- **AppModal.vue**: Add `max-h-[85vh] overflow-y-auto` for small screens
- **Touch feedback**: `active:scale-95` / `active:bg-white/10` on buttons (hover is invisible on touch)
- **Toaster position**: Switch to `top-center` on mobile so it doesn't overlap the bottom bar
- **Source tabs**: Hide dimension labels and close buttons on mobile to save space
- **Orientation**: Ensure bottom bar and sheets work in both portrait and landscape

---

## Files Summary

### Create (4 files)
| File | Purpose |
|------|---------|
| `app/composables/useIsMobile.ts` | Shared mobile breakpoint |
| `app/components/ui/AppBottomSheet.vue` | Bottom sheet with snap points + swipe gestures |
| `app/components/snip/SnipToolbarMobile.vue` | Snipper floating bottom bar |
| `app/components/composition/ComposerToolbarMobile.vue` | Composer floating bottom bar |

### Modify (14 files)
| File | Changes |
|------|---------|
| `nuxt.config.ts` | Viewport meta |
| `app/assets/css/main.css` | Mobile variant, safe-area, touch utilities |
| `app/app.vue` | Conditional toaster position |
| `app/pages/dashboard.vue` | Header collapse, card action menus |
| `app/components/snip/SnipTool.vue` | Conditional sidebars, touch handlers, mobile toolbar |
| `app/components/snip/SnipList.vue` | Mobile mode prop |
| `app/components/snip/SnipPanel.vue` | Mobile mode prop |
| `app/components/snip/SnipOverlay.vue` | Tap-to-select, hide handles on mobile |
| `app/components/composition/CompositionEditor.vue` | Conditional sidebars for auto-collage |
| `app/components/composition/FreeformEditor.vue` | Conditional sidebars, touch, mobile toolbar |
| `app/components/composition/ComposerToolbar.vue` | Hide on mobile |
| `app/components/composition/CompositionSettingsPanel.vue` | Reorder for mobile |
| `app/components/NewProjectModal.vue` | URL-first on mobile, larger targets |
| `app/components/ui/AppModal.vue` | Max-height overflow |

---

## Verification

- Test on physical device or Chrome DevTools mobile emulation (iPhone 14 Pro, 393×852)
- Dashboard: header doesn't overflow, grid collapses, card menus accessible
- Snipper: viewport fills screen, bottom sheet opens for snip list and panel, pinch-to-zoom works, tap selects snips
- Composer: canvas fills screen, Export reachable in ≤1 tap from canvas view, bottom sheets for layers and settings
- Capture flow: New Project → URL → capture → auto-compose → Export in under 5 taps
- No regressions on desktop (mouse interactions unchanged, sidebars render normally)
