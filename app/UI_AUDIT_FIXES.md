# Snipfolio — UI audit & fix prompt

This is a targeted fix pass based on screenshots of the current implementation. Do not rebuild anything — fix the specific issues listed below. Every issue includes the exact correct value from the design system.

---

## 1. Background color is wrong everywhere

**Current:** Pure black `#0a0a0a` or `#000000`
**Fix:** Change to `#111316` — this is a very slightly blue-tinted near-black, not pure black. It makes the Ash Blue accent feel intentional.

Apply to:
- `html`, `body`
- Page background
- The overlay behind modals (use `rgba(0,0,0,0.6)` not pure black)

---

## 2. Primary button text must be dark, not white

**Current:** "New project", "Create", "Export PNG", "Choose file" all show white text on the `#8E9EAD` accent background.
**Fix:** Text color must be `#111316` on ALL primary buttons. The accent color is light enough that dark text is correct and accessible. White text on this accent fails contrast.

```
.btn-primary, button[variant="primary"], any filled accent-bg button:
  color: #111316 !important
```

This applies to every primary button in the app:
- "New project" (dashboard)
- "Create" (modals)
- "Export PNG" (composition editor)
- "Choose file" (upload screen)

---

## 3. Button border radius is too large

**Current:** Buttons appear to have ~20px+ radius (pill-shaped)
**Fix:** All buttons must use exactly `6px` border radius. Not 8px, not 20px, not 50px. `6px`.

```
button, .btn:
  border-radius: 6px
```

Exception: badges/pills use `border-radius: 99px` — buttons do not.

---

## 4. Modal border radius too large

**Current:** Modals ("New Project", "New Composition") have very rounded corners, ~20px+
**Fix:** Modals use `border-radius: 16px` — not more.

Also fix modal-specific issues:
- Modal background: `#1E2228` (surface-raised), not `#1a1a2e` or similar
- Modal border: `0.5px solid rgba(255,255,255,0.12)`
- Modal padding: `24px`
- Modal max-width: `520px` (New Project), `760px` (New Composition — it's wider)

---

## 5. Wordmark `.io` must be accent color

**Current:** "snipfol.io" in the navbar renders as flat white/grey text
**Fix:** The `.io` portion must always be `#8E9EAD`

```html
<span class="wordmark">snipfol<span style="color: #8E9EAD">.io</span></span>
```

Apply everywhere the wordmark appears: navbar, auth pages, any marketing copy.

---

## 6. Navbar background and border

**Current:** Navbar appears to use `#000` or `#0d0d0d`
**Fix:**
```
navbar:
  background:    #16191D
  border-bottom: 0.5px solid rgba(255,255,255,0.06)
  height:        48px
```

---

## 7. Card borders too bright

**Current:** Project cards on the dashboard have clearly visible bright borders
**Fix:**
```
card border: 0.5px solid rgba(255,255,255,0.06)
card background: #1E2228
card border-radius: 12px

card hover:
  border-color: rgba(255,255,255,0.12)
```

---

## 8. "SETTINGS" overline color

**Current:** "SETTINGS" label in the composition editor right panel appears in a light/white color
**Fix:**
```
overline / section labels:
  color:          #4A5E6E   ← accent-dark, not text-muted or text-primary
  font-size:      11px
  font-weight:    500
  letter-spacing: 0.07em
  text-transform: uppercase
```

This applies to all section labels: "SETTINGS", "Background", any sidebar section headers.

---

## 9. Input fields

**Current:** Inputs look reasonable but need exact values matched
**Fix:**
```
input:
  height:        32px
  padding:       0 10px
  font-size:     13px
  border-radius: 6px
  border:        0.5px solid rgba(255,255,255,0.12)
  background:    #16191D
  color:         #E2E6EA
  caret-color:   #8E9EAD

  focus:
    border-color: #8E9EAD
    outline:      none

  placeholder:
    color:   #6B7280
    opacity: 1
```

The color input (hex value next to the color swatch) should use `Geist Mono` font since it's showing a hex value.

---

## 10. Composition type selector cards

**Current:** Type cards (Laptop, Laptop + Phone, Auto-Collage, Free-form) look close but need refinement
**Fix:**
```
type card (unselected):
  background:    #1E2228
  border:        0.5px solid rgba(255,255,255,0.06)
  border-radius: 8px
  padding:       12px

type card (selected/active):
  background:    rgba(142,158,173,0.08)
  border:        1.5px solid #8E9EAD
  border-radius: 8px

type card title:
  font-size:     13px
  font-weight:   500
  color:         #E2E6EA
  margin-top:    8px

type card description:
  font-size:     12px
  font-weight:   400
  color:         #6B7280
  margin-top:    2px
```

---

## 11. Output size selector buttons (composition editor)

**Current:** "1920×1080", "1080×1920" etc. appear as rounded pill buttons
**Fix:** These are segmented selector buttons, not pills:
```
size option (unselected):
  height:        30px
  padding:       0 12px
  border-radius: 6px
  border:        0.5px solid rgba(255,255,255,0.06)
  background:    transparent
  font-size:     12px
  font-weight:   400
  color:         #6B7280
  font-family:   Geist Mono

size option (selected):
  border:        1.5px solid #8E9EAD
  background:    rgba(142,158,173,0.08)
  color:         #E2E6EA
  font-weight:   500
```

---

## 12. Export PNG button

**Current:** Full-width, washed out appearance in the right panel
**Fix:** Full-width primary button, standard spec but full width:
```
width:         100%
height:        36px   ← slightly taller since it's the primary CTA
background:    #8E9EAD
color:         #111316   ← dark text, NOT white
font-size:     13px
font-weight:   500
border-radius: 6px
border:        none
```

---

## 13. Drop zone (upload screen)

**Current:** Drop zone card has rounded corners, icon and text look correct but button is pill-shaped
**Fix:**
```
drop zone container:
  background:    #16191D
  border:        1.5px dashed rgba(255,255,255,0.12)
  border-radius: 12px
  padding:       48px 32px

  drag-over state:
    border-color: #8E9EAD
    background:   rgba(142,158,173,0.04)

drop zone title:
  font-size:     14px
  font-weight:   500
  color:         #E2E6EA

drop zone subtitle:
  font-size:     12px
  color:         #6B7280
  margin-top:    4px

"Choose file" button:
  → use secondary button spec
  height:        32px
  border-radius: 6px   ← NOT pill shaped
  border:        0.5px solid rgba(255,255,255,0.12)
  background:    transparent
  color:         #E2E6EA
  font-size:     13px
  margin-top:    16px
```

---

## 14. Slider (Gap slider in composition editor)

**Current:** Slider appears functional but uses browser default styling
**Fix:**
```css
input[type="range"] {
  -webkit-appearance: none;
  height: 3px;
  border-radius: 99px;
  background: #1E2228;
  accent-color: #8E9EAD;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 99px;
  background: #8E9EAD;
  border: 2px solid #111316;
  cursor: grab;
}

input[type="range"]::-webkit-slider-thumb:active {
  cursor: grabbing;
}
```

Label above slider ("Gap: 24px"):
```
font-size:    12px
font-weight:  400
color:        #6B7280
value ("24px"): font-family Geist Mono · color #8E9EAD
```

---

## 15. "Global caption" row

**Current:** "Global caption — Off" appears as plain text
**Fix:**
```
row:
  display:      flex
  align-items:  center
  justify-content: space-between
  padding:      8px 0

label:
  font-size:    13px
  color:        #E2E6EA

"Off" / "On" value:
  font-size:    12px
  font-family:  Geist Mono
  color:        #6B7280
```

This should eventually be a toggle switch — for now the text display is fine, just apply the correct styles.

---

## 16. Back arrow / breadcrumb in composition editor

**Current:** "← Snnipper" (note: also has a typo — should be "← Snipfolio" or "← Projects")
**Fix the typo first.** Then style:
```
back link:
  font-size:    13px
  color:        #6B7280
  display:      flex, align-items center, gap 6px

  hover:
    color:      #E2E6EA

arrow icon:     14px
separator " / " or " · ": color #4A5E6E

composition name (breadcrumb):
  font-size:    13px
  font-weight:  500
  color:        #E2E6EA
```

---

## 17. "Saved" status indicator

**Current:** "✓ Saved" appears in the top right — good that it exists, but needs exact styling
**Fix:**
```
font-size:    12px
font-family:  Geist Mono
color:        #6B7280
display:      flex, align-items center, gap 6px

dot:          6×6px · border-radius 99px · background #5DCAA5
"Saved" text: color #6B7280

"Saving…":    dot background #EF9F27 · pulsing opacity animation
"Unsaved":    dot background #F09595 · text color #F09595
```

---

## 18. Warning/info box in composition sidebar

**Current:** "Frames are not supported in Auto-Collage..." box has visible styling but looks like a generic alert
**Fix:**
```
background:    rgba(239,159,39,0.08)
border:        0.5px solid rgba(239,159,39,0.2)
border-radius: 6px
padding:       10px 12px
font-size:     12px
color:         #6B7280
line-height:   1.5

left accent:   3px wide · background #EF9F27 · border-radius 99px
```

---

## 19. "Sign out" button in navbar

**Current:** Appears as a pill/rounded button
**Fix:** Use ghost button spec:
```
height:        32px
padding:       0 12px
border-radius: 6px
background:    transparent
border:        0.5px solid rgba(255,255,255,0.12)
color:         #6B7280
font-size:     13px

hover:
  color:       #E2E6EA
  background:  rgba(255,255,255,0.04)
```

---

## 20. Global: remove all pill-shaped buttons

Do a global search for `border-radius` values above `8px` on any `button` or `[role="button"]` element. Any value above `8px` on a button is wrong. Set them all to `6px`. The only elements that should have `border-radius: 99px` are badges, pills, toggle thumbs, toggle tracks, dots, and the slider thumb.

---

## 21. Global: font consistency

Ensure Geist is loaded and applied globally. Any element still rendering in system-ui or a fallback font means the Google Fonts import is not working or not applied to that element.

Geist Mono must be applied to:
- All hex color values (`#1a1a2e`, `#8E9EAD` etc.)
- All dimension values (`1920×1080`, `24px`, filenames)
- The save status text
- Keyboard shortcuts (if any)
- The gap label value

---

## Priority order

Fix in this order — highest visual impact first:

1. Button text color (dark on accent) — #2 above
2. Background color `#111316` — #1 above
3. All border-radius on buttons to `6px` — #3 above
4. Wordmark `.io` accent color — #5 above
5. Modal styling — #4 above
6. Everything else in order listed
