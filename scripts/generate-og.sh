#!/bin/bash
# Generates public/og-image.png at 1200x630 using ImageMagick native drawing.
# Run from any directory: bash scripts/generate-og.sh

set -euo pipefail

FONT="$HOME/Library/Fonts/Geist-VariableFont_wght.ttf"
OUT="$(dirname "$0")/../public/og-image.png"

# ── Colours ────────────────────────────────────────────────────────────────
BG="#111316"
SURFACE2="#16191d"
SURFACE3="#1e2228"
SURFACE4="#2c3238"
TEXT="#e2e6ea"
ACCENT="#8e9ead"
MUTED="#4a5e6e"
INFO="#38bdf8"
RED="#f09595"
YELLOW="#ef9f27"
GREEN="#5dcaa5"
DANGER="#f09595"

magick \
  \
  `# ── 1. Background radial gradient ───────────────────────────────────────` \
  \( -size 1200x630 radial-gradient:"${SURFACE3}-${BG}" \) \
  \
  `# ── 2. Dot-grid overlay (1px dots every 32px, 4% white) ─────────────────` \
  \( -size 32x32 xc:none \
     -fill "rgba(255,255,255,0.04)" \
     -draw "point 0,0" \
     -write mpr:dot +delete \
     -size 1200x630 tile:mpr:dot \) \
  -composite \
  \
  `# ── 3. Vertical accent bar (left) ────────────────────────────────────────` \
  \( -size 1200x630 xc:none \
     -fill none \
     -stroke "rgba(142,158,173,0.30)" -strokewidth 1.5 \
     -draw "line 148,215 148,415" \) \
  -composite \
  \
  `# ── 4. Divider between text and visual (right) ───────────────────────────` \
  \( -size 1200x630 xc:none \
     -fill none \
     -stroke "rgba(255,255,255,0.05)" -strokewidth 1 \
     -draw "line 638,75 638,555" \) \
  -composite \
  \
  `# ── 5. Browser chrome ────────────────────────────────────────────────────` \
  `# outer rounded rect` \
  \( -size 1200x630 xc:none \
     -fill "${SURFACE2}" \
     -stroke "${SURFACE4}" -strokewidth 1 \
     -draw "roundrectangle 664,78 1124,550 10,10" \
     `# top bar` \
     -fill "${SURFACE3}" \
     -stroke none -strokewidth 0 \
     -draw "roundrectangle 665,79 1123,116 9,9" \
     -fill "${SURFACE2}" \
     -draw "rectangle 665,104 1123,116" \
     `# traffic lights` \
     -fill "rgba(240,149,149,0.65)" \
     -draw "circle 695,98 701,98" \
     -fill "rgba(239,159,39,0.65)" \
     -draw "circle 714,98 720,98" \
     -fill "rgba(93,202,165,0.65)" \
     -draw "circle 733,98 739,98" \
     `# URL bar` \
     -fill "#0d0f11" \
     -draw "roundrectangle 762,87 980,109 4,4" \
     `# content area` \
     -fill "#0d0f11" \
     -draw "rectangle 665,116 1123,550" \
  \) \
  -composite \
  \
  `# ── 6. Simulated UI blocks inside browser ────────────────────────────────` \
  \( -size 1200x630 xc:none \
     `# header bar` \
     -fill "${BG}" \
     -draw "rectangle 665,116 1123,158" \
     -fill "${SURFACE4}" \
     -draw "roundrectangle 680,135 742,149 3,3" \
     -draw "roundrectangle 1040,135 1093,149 3,3" \
     -fill "${SURFACE3}" \
     -stroke "${SURFACE4}" -strokewidth 1 \
     -draw "roundrectangle 1098,133 1115,151 3,3" \
     `# left sidebar` \
     -fill "${BG}" \
     -stroke none \
     -draw "rectangle 665,158 748,550" \
     -fill "${SURFACE4}" \
     -draw "roundrectangle 678,172 728,181 2,2" \
     -fill "${SURFACE3}" \
     -draw "roundrectangle 678,189 728,198 2,2" \
     -draw "roundrectangle 678,206 728,215 2,2" \
     -draw "roundrectangle 678,223 728,232 2,2" \
     `# right panel` \
     -fill "${BG}" \
     -draw "rectangle 1022,158 1123,550" \
     -fill "${SURFACE4}" \
     -draw "roundrectangle 1030,172 1115,181 2,2" \
     -fill "${SURFACE3}" \
     -draw "roundrectangle 1030,189 1100,198 2,2" \
     -draw "roundrectangle 1030,206 1115,213 2,2" \
     -draw "roundrectangle 1030,220 1115,246 3,3" \
     `# content row 1 bg` \
     -fill "${SURFACE3}" \
     -draw "roundrectangle 757,166 1014,322 3,3" \
     `# content blocks row 1` \
     -fill "${SURFACE4}" \
     -draw "roundrectangle 765,174 870,240 2,2" \
     -draw "roundrectangle 878,174 1006,240 2,2" \
     -draw "roundrectangle 765,248 1006,314 2,2" \
     `# content row 2 bg` \
     -fill "${SURFACE3}" \
     -draw "roundrectangle 757,330 1014,430 3,3" \
     -fill "${SURFACE4}" \
     -draw "roundrectangle 765,338 870,422 2,2" \
     -draw "roundrectangle 878,338 1006,422 2,2" \
     `# content row 3 bg` \
     -fill "${SURFACE3}" \
     -draw "roundrectangle 757,438 1014,542 3,3" \
     -fill "${SURFACE4}" \
     -draw "roundrectangle 765,446 1006,534 2,2" \
  \) \
  -composite \
  \
  `# ── 7. Selection box 1 — rows 1+2 merged (info blue / active) ───────────` \
  `# fill tint` \
  \( -size 1200x630 xc:none \
     -fill "rgba(56,189,248,0.07)" -stroke none \
     -draw "rectangle 756,165 1015,431" \
  \) -composite \
  `# dashed border (simulate with alternating segments)` \
  \( -size 1200x630 xc:none \
     -fill none \
     -stroke "${INFO}" -strokewidth 1.5 \
     `# top edge segments` \
     -draw "line 756,165 768,165" \
     -draw "line 774,165 786,165" \
     -draw "line 792,165 804,165" \
     -draw "line 810,165 822,165" \
     -draw "line 828,165 840,165" \
     -draw "line 846,165 858,165" \
     -draw "line 864,165 876,165" \
     -draw "line 882,165 894,165" \
     -draw "line 900,165 912,165" \
     -draw "line 918,165 930,165" \
     -draw "line 936,165 948,165" \
     -draw "line 954,165 966,165" \
     -draw "line 972,165 984,165" \
     -draw "line 990,165 1002,165" \
     -draw "line 1008,165 1015,165" \
     `# right edge segments` \
     -draw "line 1015,165 1015,177" \
     -draw "line 1015,183 1015,195" \
     -draw "line 1015,201 1015,213" \
     -draw "line 1015,219 1015,231" \
     -draw "line 1015,237 1015,249" \
     -draw "line 1015,255 1015,267" \
     -draw "line 1015,273 1015,285" \
     -draw "line 1015,291 1015,303" \
     -draw "line 1015,309 1015,321" \
     -draw "line 1015,327 1015,339" \
     -draw "line 1015,345 1015,357" \
     -draw "line 1015,363 1015,375" \
     -draw "line 1015,381 1015,393" \
     -draw "line 1015,399 1015,411" \
     -draw "line 1015,417 1015,431" \
     `# bottom edge segments` \
     -draw "line 1015,431 1003,431" \
     -draw "line 997,431 985,431" \
     -draw "line 979,431 967,431" \
     -draw "line 961,431 949,431" \
     -draw "line 943,431 931,431" \
     -draw "line 925,431 913,431" \
     -draw "line 907,431 895,431" \
     -draw "line 889,431 877,431" \
     -draw "line 871,431 859,431" \
     -draw "line 853,431 841,431" \
     -draw "line 835,431 823,431" \
     -draw "line 817,431 805,431" \
     -draw "line 799,431 787,431" \
     -draw "line 781,431 769,431" \
     -draw "line 763,431 756,431" \
     `# left edge segments` \
     -draw "line 756,431 756,419" \
     -draw "line 756,413 756,401" \
     -draw "line 756,395 756,383" \
     -draw "line 756,377 756,365" \
     -draw "line 756,359 756,347" \
     -draw "line 756,341 756,329" \
     -draw "line 756,323 756,311" \
     -draw "line 756,305 756,293" \
     -draw "line 756,287 756,275" \
     -draw "line 756,269 756,257" \
     -draw "line 756,251 756,239" \
     -draw "line 756,233 756,221" \
     -draw "line 756,215 756,203" \
     -draw "line 756,197 756,185" \
     -draw "line 756,179 756,165" \
  \) -composite \
  `# Corner handles` \
  \( -size 1200x630 xc:none \
     -fill "${INFO}" -stroke none \
     -draw "rectangle 750,159 758,167" \
     -draw "rectangle 1009,159 1017,167" \
     -draw "rectangle 750,425 758,433" \
     -draw "rectangle 1009,425 1017,433" \
  \) -composite \
  `# Label pill "Desktop"` \
  \( -size 1200x630 xc:none \
     -fill "${INFO}" \
     -draw "roundrectangle 752,145 820,163 4,4" \
  \) -composite \
  \
  `# ── 8. Selection box 2 — row 3 (accent / secondary) ─────────────────────` \
  \( -size 1200x630 xc:none \
     -fill "rgba(142,158,173,0.05)" -stroke none \
     -draw "rectangle 756,437 1015,543" \
  \) -composite \
  `# dashed border accent` \
  \( -size 1200x630 xc:none \
     -fill none \
     -stroke "${ACCENT}" -strokewidth 1.5 \
     -draw "line 756,437 768,437" -draw "line 774,437 786,437" -draw "line 792,437 804,437" \
     -draw "line 810,437 822,437" -draw "line 828,437 840,437" -draw "line 846,437 858,437" \
     -draw "line 864,437 876,437" -draw "line 882,437 894,437" -draw "line 900,437 912,437" \
     -draw "line 918,437 930,437" -draw "line 936,437 948,437" -draw "line 954,437 966,437" \
     -draw "line 972,437 984,437" -draw "line 990,437 1002,437" -draw "line 1008,437 1015,437" \
     -draw "line 1015,437 1015,449" -draw "line 1015,455 1015,467" -draw "line 1015,473 1015,485" \
     -draw "line 1015,491 1015,503" -draw "line 1015,509 1015,521" -draw "line 1015,527 1015,539" \
     -draw "line 1015,543 1003,543" -draw "line 997,543 985,543" -draw "line 979,543 967,543" \
     -draw "line 961,543 949,543" -draw "line 943,543 931,543" -draw "line 925,543 913,543" \
     -draw "line 907,543 895,543" -draw "line 889,543 877,543" -draw "line 871,543 859,543" \
     -draw "line 853,543 841,543" -draw "line 835,543 823,543" -draw "line 817,543 805,543" \
     -draw "line 799,543 787,543" -draw "line 781,543 769,543" -draw "line 763,543 756,543" \
     -draw "line 756,543 756,531" -draw "line 756,525 756,513" -draw "line 756,507 756,495" \
     -draw "line 756,489 756,477" -draw "line 756,471 756,459" -draw "line 756,453 756,437" \
  \) -composite \
  `# corner handles (accent, slightly transparent)` \
  \( -size 1200x630 xc:none \
     -fill "rgba(142,158,173,0.75)" \
     -draw "rectangle 750,431 758,439" \
     -draw "rectangle 1009,431 1017,439" \
     -draw "rectangle 750,537 758,545" \
     -draw "rectangle 1009,537 1017,545" \
  \) -composite \
  \
  `# ── 9. Text — URL bar label ──────────────────────────────────────────────` \
  -font "$FONT" \
  -pointsize 11 -fill "${MUTED}" \
  -annotate +787+102 "app.snipfolio.com" \
  \
  `# ── 10. Text — label pill "Desktop" ─────────────────────────────────────` \
  -font "$FONT" \
  -weight 700 -pointsize 11 -fill "#0d0f11" \
  -annotate +761+160 "Desktop" \
  \
  `# ── 11. Text — Wordmark ──────────────────────────────────────────────────` \
  -weight 700 -pointsize 72 -fill "${TEXT}" \
  -annotate +170+300 "Snipfolio" \
  \
  `# ── 12. Text — Tagline ───────────────────────────────────────────────────` \
  -weight 400 -pointsize 26 -fill "${ACCENT}" \
  -annotate +171+348 "Screenshot clipping & composition" \
  \
  `# ── 13. Pill backgrounds ─────────────────────────────────────────────────` \
  \( -size 1200x630 xc:none \
     -fill "${SURFACE3}" \
     -stroke "${SURFACE4}" -strokewidth 1 \
     -draw "roundrectangle 171,376 334,406 15,15" \
     -draw "roundrectangle 342,376 478,406 15,15" \
     -draw "roundrectangle 486,376 621,406 15,15" \
  \) -composite \
  \
  `# ── 14. Text — Pills ─────────────────────────────────────────────────────` \
  -weight 400 -pointsize 14 -fill "${ACCENT}" \
  -annotate +196+395 "Device frames" \
  -annotate +366+395 "No Figma" \
  -annotate +505+395 "Free to start" \
  \
  `# ── 15. Text — Domain ────────────────────────────────────────────────────` \
  -weight 400 -pointsize 18 -fill "${MUTED}" \
  -annotate +171+464 "snipfolio.com" \
  \
  "$OUT"

echo "✓ OG image written to $OUT"
