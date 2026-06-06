# Snipfolio — branding implementation prompt for Claude Code

Implement the complete Snipfolio design system across the entire app. Every component, every state, every element. Do not leave any component unstyled or using a default/fallback style. This document is the single source of truth — if it specifies a value, use it exactly.

---

## Fonts

```
Primary:    Geist, ui-sans-serif, system-ui, sans-serif
Monospace:  Geist Mono, ui-monospace, monospace
```

Google Fonts import (add to main.css):
```css
@import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;500&family=Geist+Mono:wght@400;500&display=swap');
```

Font weight rules:
- 400 — body copy, secondary labels, input values
- 500 — headings, buttons, nav, labels, badges, anything interactive
- NEVER use 600, 700, or bold anywhere in the app

Anti-aliasing: `-webkit-font-smoothing: antialiased` on `html`

---

## Color tokens

Define as CSS custom properties on `:root`. Use these token names everywhere — never hardcode hex values in component styles.

```css
:root {
  /* accent */
  --sf-accent:          #8E9EAD;
  --sf-accent-dark:     #4A5E6E;
  --sf-accent-tint:     rgba(142, 158, 173, 0.12);
  --sf-accent-tint-md:  rgba(142, 158, 173, 0.15);

  /* backgrounds */
  --sf-bg:              #111316;
  --sf-surface:         #16191D;
  --sf-surface-raised:  #1E2228;

  /* borders */
  --sf-border:          rgba(255, 255, 255, 0.06);
  --sf-border-emphasis: rgba(255, 255, 255, 0.12);

  /* text */
  --sf-text-primary:    #E2E6EA;
  --sf-text-muted:      #6B7280;
  --sf-text-accent:     #8E9EAD;

  /* semantic */
  --sf-success:         #5DCAA5;
  --sf-danger:          #F09595;
  --sf-warning:         #EF9F27;

  /* semantic tints */
  --sf-success-tint:    rgba(93, 202, 165, 0.12);
  --sf-danger-tint:     rgba(240, 149, 149, 0.12);
  --sf-warning-tint:    rgba(239, 159, 39, 0.12);
}
```

---

## Base / global

```
html, body:
  background:       var(--sf-bg)
  color:            var(--sf-text-primary)
  font-family:      Geist, ui-sans-serif, system-ui, sans-serif
  font-size:        14px
  font-weight:      400
  line-height:      1.5
  -webkit-font-smoothing: antialiased

*, *::before, *::after:
  box-sizing: border-box

::selection:
  background: var(--sf-accent-tint-md)
  color:      var(--sf-text-primary)
```

---

## Scrollbars

Apply globally:
```
width / height:   6px
track:            transparent
thumb:            rgba(142, 158, 173, 0.18)
thumb hover:      rgba(142, 158, 173, 0.32)
border-radius:    99px
```

---

## Typography scale

| Role            | Size  | Weight | Line height | Letter spacing | Transform  | Color                |
|-----------------|-------|--------|-------------|----------------|------------|----------------------|
| Display         | 36px  | 500    | 1.15        | -0.03em        | —          | --sf-text-primary    |
| H1              | 24px  | 500    | 1.25        | -0.02em        | —          | --sf-text-primary    |
| H2              | 18px  | 500    | 1.3         | -0.02em        | —          | --sf-text-primary    |
| H3              | 15px  | 500    | 1.4         | -0.01em        | —          | --sf-text-primary    |
| Body            | 14px  | 400    | 1.6         | 0              | —          | --sf-text-muted      |
| Body strong     | 14px  | 500    | 1.6         | 0              | —          | --sf-text-primary    |
| Small           | 12px  | 400    | 1.5         | 0              | —          | --sf-text-muted      |
| Overline        | 11px  | 500    | 1           | 0.07em         | uppercase  | --sf-accent-dark     |
| Mono            | 13px  | 400    | 1.5         | 0              | —          | --sf-text-accent     |
| Mono small      | 11px  | 400    | 1.5         | 0              | —          | --sf-text-muted      |

---

## Spacing

Base unit: 4px. Use multiples only.
```
4px   — tight inline gaps (icon + label)
8px   — small gaps, compact padding
12px  — default inline padding vertical
16px  — default section padding, card padding
24px  — section gaps
32px  — large section gaps
48px  — page section separation
```

---

## Border radius

```
4px   — tags, tooltips, small chips
6px   — inputs, small buttons, badges
8px   — default buttons, dropdowns, popovers
12px  — cards, panels
16px  — modals, sheets
```

---

## Buttons

All buttons:
- Font: Geist 500
- No uppercase
- Cursor: pointer
- Transition: background 120ms ease, color 120ms ease, border-color 120ms ease, opacity 120ms ease
- No box-shadow ever
- No outline on focus — use focus ring (see below)

### Primary button
```
height:           32px
padding:          0 16px
font-size:        13px
font-weight:      500
border-radius:    6px
border:           none
background:       var(--sf-accent)        → #8E9EAD
color:            #111316                 ← ALWAYS this dark color, never white
letter-spacing:   -0.01em

hover:
  background:     var(--sf-accent-dark)   → #4A5E6E
  color:          var(--sf-text-primary)  → #E2E6EA

active:
  background:     #3a4d5c
  color:          var(--sf-text-primary)

disabled:
  background:     rgba(142, 158, 173, 0.25)
  color:          rgba(17, 19, 22, 0.4)
  cursor:         not-allowed
  opacity:        1   ← do not use opacity, use the above colors directly
```

### Secondary button
```
height:           32px
padding:          0 16px
font-size:        13px
font-weight:      500
border-radius:    6px
border:           0.5px solid var(--sf-border-emphasis)   → rgba(255,255,255,0.12)
background:       transparent
color:            var(--sf-text-primary)   → #E2E6EA
letter-spacing:   -0.01em

hover:
  background:     var(--sf-surface-raised)  → #1E2228
  border-color:   var(--sf-accent-dark)     → #4A5E6E

active:
  background:     #252a31

disabled:
  border-color:   var(--sf-border)
  color:          var(--sf-text-muted)
  cursor:         not-allowed
```

### Ghost button
```
height:           32px
padding:          0 12px
font-size:        13px
font-weight:      400
border-radius:    6px
border:           none
background:       transparent
color:            var(--sf-text-muted)   → #6B7280
letter-spacing:   0

hover:
  background:     var(--sf-accent-tint)
  color:          var(--sf-text-primary)

active:
  background:     rgba(142, 158, 173, 0.18)

disabled:
  color:          rgba(107, 114, 128, 0.4)
  cursor:         not-allowed
```

### Danger button
```
height:           32px
padding:          0 16px
font-size:        13px
font-weight:      500
border-radius:    6px
border:           0.5px solid rgba(240, 149, 149, 0.3)
background:       transparent
color:            var(--sf-danger)   → #F09595

hover:
  background:     var(--sf-danger-tint)
  border-color:   rgba(240, 149, 149, 0.5)

disabled:
  opacity:        0.4
  cursor:         not-allowed
```

### Icon button (square, icon only)
```
width / height:   32px
border-radius:    6px
border:           none
background:       transparent
color:            var(--sf-text-muted)
display:          flex, align-items center, justify-content center

hover:
  background:     var(--sf-accent-tint)
  color:          var(--sf-text-primary)
```

### Button sizes (modifier)
```
sm:   height 26px · padding 0 10px · font-size 12px · border-radius 5px
md:   height 32px · (default, as above)
lg:   height 38px · padding 0 20px · font-size 14px · border-radius 7px
```

---

## Focus ring

Apply to ALL interactive elements (buttons, inputs, selects, checkboxes, toggles, links):
```
outline:        2px solid var(--sf-accent)   → #8E9EAD
outline-offset: 2px
border-radius:  inherit
```
Only show on keyboard focus — use `:focus-visible`, not `:focus`.

---

## Inputs (text, search, number)

```
height:           32px
padding:          0 10px
font-size:        13px
font-weight:      400
font-family:      Geist
border-radius:    6px
border:           0.5px solid var(--sf-border-emphasis)
background:       var(--sf-surface)
color:            var(--sf-text-primary)
caret-color:      var(--sf-accent)

placeholder:
  color:          var(--sf-text-muted)
  opacity:        1

hover (not focused):
  border-color:   rgba(255, 255, 255, 0.18)

focus:
  border-color:   var(--sf-accent)
  background:     var(--sf-surface)
  outline:        none   ← border handles the focus indicator here

error state:
  border-color:   var(--sf-danger)

disabled:
  background:     rgba(22, 25, 29, 0.5)
  color:          var(--sf-text-muted)
  cursor:         not-allowed
```

### Textarea
Same as input but:
```
height:       auto (min-height 80px)
padding:      8px 10px
resize:       vertical
line-height:  1.6
```

### Input with icon (search, etc.)
```
padding-left: 32px
icon:         16px · color var(--sf-text-muted) · absolute, left 10px, vertically centered
```

### Input label
```
font-size:      12px
font-weight:    500
color:          var(--sf-text-muted)
margin-bottom:  4px
display:        block
```

### Input helper / error text
```
font-size:    11px
margin-top:   4px
color:        var(--sf-text-muted)   (helper)
color:        var(--sf-danger)       (error)
```

---

## Select / dropdown trigger

Same dimensions as input (height 32px). After selecting:
```
color:          var(--sf-text-primary)
chevron icon:   right 10px · 14px · color var(--sf-text-muted)
```

---

## Checkbox

```
width / height:   15px
border-radius:    3px
border:           0.5px solid var(--sf-border-emphasis)
background:       var(--sf-surface)

checked:
  background:     var(--sf-accent)
  border-color:   var(--sf-accent)
  checkmark:      SVG, color #111316, stroke-width 2

hover (unchecked):
  border-color:   var(--sf-accent-dark)

label text:
  font-size:      13px
  font-weight:    400
  color:          var(--sf-text-primary)
  margin-left:    8px
  vertical-align: middle
```

---

## Toggle / switch

```
track width:      32px
track height:     18px
border-radius:    99px
background off:   var(--sf-surface-raised)
border off:       0.5px solid var(--sf-border-emphasis)
background on:    var(--sf-accent)
border on:        none

thumb:
  width / height: 12px
  border-radius:  99px
  background:     #111316 (on) / var(--sf-text-muted) (off)
  transition:     transform 150ms ease
  transform off:  translateX(2px)
  transform on:   translateX(16px)
```

---

## Badges / pills

```
height:         20px
padding:        0 8px
border-radius:  99px
font-size:      11px
font-weight:    500
display:        inline-flex, align-items center
white-space:    nowrap
```

| Variant | Background                      | Text color         |
|---------|---------------------------------|--------------------|
| accent  | rgba(142, 158, 173, 0.15)       | #8E9EAD            |
| muted   | rgba(142, 158, 173, 0.08)       | #6B7280            |
| success | rgba(93, 202, 165, 0.12)        | #5DCAA5            |
| danger  | rgba(240, 149, 149, 0.12)       | #F09595            |
| warning | rgba(239, 159, 39, 0.12)        | #EF9F27            |

---

## Cards

```
background:     var(--sf-surface-raised)   → #1E2228
border:         0.5px solid var(--sf-border)
border-radius:  12px
padding:        16px

hover (if interactive):
  border-color: var(--sf-border-emphasis)
  cursor:       pointer

transition:     border-color 150ms ease
```

---

## Dividers

```
Horizontal:
  height:       0.5px
  background:   var(--sf-border)
  border:       none
  margin:       0

Vertical:
  width:        0.5px
  background:   var(--sf-border)
  align-self:   stretch
```

---

## Navbar

```
height:           48px
background:       var(--sf-surface)   → #16191D
border-bottom:    0.5px solid var(--sf-border)
padding:          0 20px
display:          flex, align-items center, gap 16px

logo area:
  display:        flex, align-items center, gap 8px
  icon:           36×36px (default logo mark SVG)
  wordmark:       font-size 15px · weight 500 · color var(--sf-text-primary)
  ".io" in wordmark: color var(--sf-accent)

nav links:
  font-size:      13px
  font-weight:    400
  color:          var(--sf-text-muted)
  padding:        4px 10px
  border-radius:  6px
  transition:     color 120ms, background 120ms

  hover:
    color:        var(--sf-text-primary)
    background:   var(--sf-accent-tint)

  active/current:
    color:        var(--sf-text-primary)
    background:   var(--sf-accent-tint)
    font-weight:  500
```

---

## Sidebar

```
width:            240px
background:       var(--sf-surface)   → #16191D
border-right:     0.5px solid var(--sf-border)
padding:          12px 8px

section label:
  font-size:      11px
  font-weight:    500
  color:          var(--sf-accent-dark)
  letter-spacing: 0.07em
  text-transform: uppercase
  padding:        0 8px
  margin-bottom:  4px
  margin-top:     16px
  first-of-type margin-top: 4px

sidebar item:
  height:         32px
  padding:        0 8px
  border-radius:  6px
  font-size:      13px
  font-weight:    400
  color:          var(--sf-text-muted)
  display:        flex, align-items center, gap 8px
  cursor:         pointer
  transition:     background 120ms, color 120ms

  icon:           16px · color inherit

  hover:
    background:   var(--sf-accent-tint)
    color:        var(--sf-text-primary)

  active:
    background:   var(--sf-accent-tint-md)
    color:        var(--sf-text-primary)
    font-weight:  500

  active indicator:
    2px wide · height 16px · background var(--sf-accent)
    border-radius 99px · left -8px (outside padding) · absolutely positioned
```

---

## Dropdown / popover menu

```
background:       var(--sf-surface-raised)   → #1E2228
border:           0.5px solid var(--sf-border-emphasis)
border-radius:    8px
padding:          4px
min-width:        160px
box-shadow:       none   ← never
z-index:          50

menu item:
  height:         30px
  padding:        0 10px
  border-radius:  5px
  font-size:      13px
  font-weight:    400
  color:          var(--sf-text-primary)
  display:        flex, align-items center, gap 8px
  cursor:         pointer
  transition:     background 100ms

  hover:
    background:   var(--sf-accent-tint)

  danger item:
    color:        var(--sf-danger)
    hover background: var(--sf-danger-tint)

  icon:           14px · color var(--sf-text-muted)
  danger icon:    14px · color var(--sf-danger)

  disabled:
    color:        var(--sf-text-muted)
    cursor:       not-allowed
    hover:        no background change

menu divider:
  height:         0.5px
  background:     var(--sf-border)
  margin:         4px 0
```

---

## Modal / dialog (Headless UI Dialog)

```
overlay:
  background:     rgba(0, 0, 0, 0.6)
  backdrop-filter: none   ← never blur

panel:
  background:     var(--sf-surface-raised)   → #1E2228
  border:         0.5px solid var(--sf-border-emphasis)
  border-radius:  16px
  padding:        24px
  min-width:      400px
  max-width:      520px

header:
  font-size:      16px
  font-weight:    500
  color:          var(--sf-text-primary)
  margin-bottom:  8px

description:
  font-size:      13px
  color:          var(--sf-text-muted)
  margin-bottom:  20px

footer:
  display:        flex, justify-content flex-end, gap 8px
  margin-top:     20px
  padding-top:    16px
  border-top:     0.5px solid var(--sf-border)

close button:
  position:       absolute top 16px right 16px
  use icon button spec (32×32, ghost style)
```

---

## Tooltip

```
background:       var(--sf-surface-raised)
border:           0.5px solid var(--sf-border-emphasis)
border-radius:    4px
padding:          4px 8px
font-size:        12px
font-weight:      400
color:            var(--sf-text-primary)
max-width:        200px
pointer-events:   none
z-index:          100

delay:            show after 500ms, hide immediately
```

---

## Tabs

```
tab list:
  display:        flex
  gap:            2px
  border-bottom:  0.5px solid var(--sf-border)
  padding-bottom: 0

tab:
  height:         34px
  padding:        0 14px
  font-size:      13px
  font-weight:    400
  color:          var(--sf-text-muted)
  border:         none
  background:     transparent
  border-bottom:  2px solid transparent
  margin-bottom:  -0.5px
  cursor:         pointer
  transition:     color 120ms, border-color 120ms

  hover:
    color:        var(--sf-text-primary)

  active/selected:
    color:        var(--sf-text-primary)
    font-weight:  500
    border-bottom-color: var(--sf-accent)
```

---

## Slider (range input)

```
track:
  height:         3px
  border-radius:  99px
  background:     var(--sf-surface-raised)
  accent-color:   var(--sf-accent)

thumb:
  width / height: 14px
  border-radius:  99px
  background:     var(--sf-accent)
  border:         2px solid var(--sf-bg)
  cursor:         grab

  active:
    cursor:       grabbing
```

---

## Save status indicator

```
font-size:      12px
font-weight:    400
font-family:    Geist Mono
display:        flex, align-items center, gap 6px

dot:            6×6px circle

"Saved":        dot color var(--sf-success) · text color var(--sf-text-muted)
"Saving…":      dot color var(--sf-warning) · pulsing animation · text var(--sf-text-muted)
"Unsaved":      dot color var(--sf-danger)  · text color var(--sf-danger)
```

---

## Snip overlay (on source screenshot viewport)

```
border:         1.5px solid rgba(142, 158, 173, 0.75)
background:     rgba(142, 158, 173, 0.08)
border-radius:  3px

label pill:
  position:     top-left corner of the snip box
  background:   var(--sf-accent)     → #8E9EAD
  color:        #111316
  font-size:    10px
  font-weight:  500
  font-family:  Geist Mono
  padding:      2px 6px
  border-radius: 0 0 4px 0   ← bottom-right only

selected snip:
  border-color: var(--sf-accent)
  border-width: 2px
  background:   rgba(142, 158, 173, 0.14)

resize handles (selected only):
  8×8px squares · background var(--sf-accent) · border 1.5px solid #111316
  border-radius: 2px · positioned at 8 points around the rect
```

---

## Empty states

```
container:
  display:        flex, flex-direction column, align-items center, gap 12px
  padding:        48px 24px
  text-align:     center

icon:             32px · color var(--sf-text-muted) · opacity 0.5
title:            font-size 14px · weight 500 · color var(--sf-text-primary)
description:      font-size 13px · color var(--sf-text-muted) · max-width 280px
action button:    primary button (standard spec)
```

---

## Loading / skeleton

```
skeleton block:
  background:     linear-gradient(
                    90deg,
                    var(--sf-surface-raised) 25%,
                    rgba(142,158,173,0.06) 50%,
                    var(--sf-surface-raised) 75%
                  )
  background-size: 200% 100%
  animation:      shimmer 1.5s infinite
  border-radius:  4px

@keyframes shimmer {
  0%   { background-position: 200% 0 }
  100% { background-position: -200% 0 }
}
```

---

## Notifications / toasts

```
background:       var(--sf-surface-raised)
border:           0.5px solid var(--sf-border-emphasis)
border-radius:    8px
padding:          12px 14px
font-size:        13px
color:            var(--sf-text-primary)
min-width:        280px
max-width:        380px
position:         bottom-right, 20px from edges
box-shadow:       none

left accent bar:
  width:          3px
  border-radius:  99px 0 0 99px
  height:         100%

success: bar color var(--sf-success)
danger:  bar color var(--sf-danger)
warning: bar color var(--sf-warning)
info:    bar color var(--sf-accent)
```

---

## Page layout

```
root layout:
  min-height:     100vh
  display:        flex, flex-direction column
  background:     var(--sf-bg)

main content area (with sidebar):
  display:        flex, flex 1
  overflow:       hidden

content area:
  flex:           1
  overflow-y:     auto
  padding:        24px

page title row:
  display:        flex, align-items center, justify-content space-between
  margin-bottom:  24px

page title:
  font-size:      18px
  font-weight:    500
  letter-spacing: -0.02em
  color:          var(--sf-text-primary)
```

---

## Composition type selector cards

A distinct component used in the New Composition modal. Not the same as a standard card.

```
card (unselected):
  background:    var(--sf-surface-raised)   → #1E2228
  border:        0.5px solid var(--sf-border)
  border-radius: 8px
  padding:       12px
  cursor:        pointer
  transition:    border-color 150ms, background 150ms

  hover:
    border-color: var(--sf-border-emphasis)

card (selected):
  background:    rgba(142, 158, 173, 0.08)
  border:        1.5px solid var(--sf-accent)   ← 1.5px not 0.5px

icon:
  16px · color var(--sf-text-muted)
  selected: color var(--sf-accent)

title:
  font-size:     13px
  font-weight:   500
  color:         var(--sf-text-primary)
  margin-top:    8px

description:
  font-size:     12px
  font-weight:   400
  color:         var(--sf-text-muted)
  margin-top:    2px
  line-height:   1.4
```

---

## Drop zone (file upload)

```
container:
  background:    var(--sf-surface)   → #16191D
  border:        1.5px dashed var(--sf-border-emphasis)
  border-radius: 12px
  padding:       48px 32px
  text-align:    center
  cursor:        pointer
  transition:    border-color 150ms, background 150ms

  drag-over:
    border-color: var(--sf-accent)
    background:   rgba(142, 158, 173, 0.04)

icon:
  32px · color var(--sf-text-muted) · opacity 0.5 · margin-bottom 12px

title:
  font-size:     14px
  font-weight:   500
  color:         var(--sf-text-primary)

subtitle:
  font-size:     12px
  color:         var(--sf-text-muted)
  margin-top:    4px

button:
  use secondary button spec
  margin-top:    16px
  border-radius: 6px   ← never pill shaped here
```

---

## Output size selector (composition editor)

Segmented button group for selecting canvas output dimensions.

```
group:
  display:       flex
  gap:           6px
  flex-wrap:     wrap

option (unselected):
  height:        30px
  padding:       0 12px
  border-radius: 6px
  border:        0.5px solid var(--sf-border)
  background:    transparent
  font-size:     12px
  font-weight:   400
  font-family:   Geist Mono
  color:         var(--sf-text-muted)
  cursor:        pointer
  transition:    border-color 150ms, background 150ms, color 150ms

  hover:
    border-color: var(--sf-border-emphasis)
    color:        var(--sf-text-primary)

option (selected):
  border:        1.5px solid var(--sf-accent)
  background:    rgba(142, 158, 173, 0.08)
  color:         var(--sf-text-primary)
  font-weight:   500

custom input pair (W × H):
  two number inputs side by side
  inputs use standard input spec
  font-family:   Geist Mono
  width:         72px each
  "×" separator: color var(--sf-text-muted) · font-size 13px · padding 0 4px
```

---

## Specific things Claude Code commonly gets wrong — fix ALL of these

1. **Primary button text must be `#111316` (near-black), NOT white.** The accent bg is light enough that dark text is correct. This is the most common mistake.
2. **No font-weight above 500 anywhere.** Not in headings, not in buttons, not anywhere.
3. **No box-shadow anywhere.** Use surface layering and borders for depth.
4. **No backdrop-filter blur on modals.** Solid overlay only.
5. **Borders are 0.5px, not 1px.** All card, input, button borders are 0.5px.
6. **Disabled states must not use `opacity: 0.5` on the whole element.** Specify exact disabled colors per component.
7. **Focus rings use `outline`, not `box-shadow`.** `outline: 2px solid var(--sf-accent)` with `outline-offset: 2px`. Only on `:focus-visible`.
8. **Nav active state uses `var(--sf-accent-tint)` background, not an underline or bold alone.**
9. **Sidebar active item has a 2px left accent bar** — don't skip this, it's the primary active indicator.
10. **The `.io` in the wordmark `snipfol.io` must be `var(--sf-accent)` color** — this applies in the navbar, auth pages, marketing, everywhere the logo appears.
11. **Geist Mono for all filenames, dimensions, keyboard shortcuts, and save status** — not Geist.
12. **No gradient backgrounds anywhere in the UI** — solid colors only.
13. **Placeholder text must be `var(--sf-text-muted)` with `opacity: 1`** — some browsers default placeholder to 0.54 opacity, override it.
14. **Overlines (section labels in sidebar etc.) are `var(--sf-accent-dark)` not `var(--sf-text-muted)`.**
15. **Dropdown menus have no box-shadow** — border + background surface is sufficient.
16. **Buttons are never pill-shaped.** If any button has `border-radius` above `8px`, it is wrong. `6px` is the standard. `99px` is only for badges, toggles, dots, and sliders.
17. **`#111316` is not pure black.** Do not substitute `#000000` or `#0a0a0a`. The blue tint is intentional and must be exact.
18. **The "New Composition" modal is wider than standard** — `max-width: 760px` because it contains a two-column layout (settings left, preview right). Do not cap it at 520px like a simple modal.
19. **Warning/info boxes inside sidebars** use `rgba(239,159,39,0.08)` background, `0.5px solid rgba(239,159,39,0.2)` border, and a `3px` left accent bar in `#EF9F27`. Never use a generic grey box for these.
20. **The "Sign out" / secondary nav actions** in the navbar use secondary button style, not ghost — they need the subtle border so they're distinguishable against the navbar background.
21. **Composition type selector cards** are a distinct component — not standard cards. Selected state uses `1.5px solid var(--sf-accent)` border (not 0.5px) so the selection is clearly visible.
