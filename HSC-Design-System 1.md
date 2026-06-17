# HSC Design System — Export

**HSC — Ho Chi Minh City Securities Corporation** · Vietnamese securities & trading platform
Dark-first trading terminal · Vietnamese-first copy · SF Pro Display · 8px grid
Source: Figma "[Root] StyleGuide 1.1.fig" · Exported June 2026

This single file is a portable summary of the system. The canonical source is `colors_and_type.css` (CSS custom properties) plus the cards in `preview/` and the `ui_kits/terminal/` recreation.

---

## 1. The one rule that defines the product

HSC is a trading platform — **every price is color-coded by its movement.** This is the most important convention in the system.

| Token | Vietnamese | Meaning | Color | Source |
|---|---|---|---|---|
| `--price-increase` | Tăng | up | `#03A61E` | → `--sg50` |
| `--price-reduced`  | Giảm | down | `#CF303D` | → `--sr50` |
| `--price-reference`| Tham chiếu | unchanged / flat | `#FFD400` | yellow |
| `--price-ceil`     | Trần | limit-up (ceiling) | `#DD5BFE` | → `--sm50` |
| `--price-floor`    | Sàn | limit-down (floor) | `#5DAAC2` | → `--sc50` |

Green = up, red = down is shared with Western markets; yellow / cyan / magenta encoding reference / floor / ceiling is the Vietnamese-exchange convention. Price colors are **semantic aliases of the secondary scales**, not standalone values.

---

## 2. Brand

| Token | Value | Use |
|---|---|---|
| `--logo-blue` | `#074B9B` | HSC wordmark fill |
| `--brand` | `#2681FF` | interactive blue — buttons, links, focus |
| `--brand-deep` | `#00468C` | corporate / primary deep blue |
| `--p100` | `#00468C` | cover / primary |
| cover gradient | `#0058AF → #00468C` | marketing covers only (the one in-system gradient) |

Logo asset: `assets/logo-hsc-full-color.svg`. On dark or photographic fields, knock the wordmark out to white. Clear-space ≈ cap-height on all sides.

---

## 3. Color — secondary scales

Each scale runs 10 (lightest) → 50 (base) → 100 (darkest). Tuned for light mode.

**Red (SR) — loss / sell / down**
`10 #EBC4C7` · `20 #EB9FA5` · `30 #EB7A84` · `40 #F64655` · `50 #CF303D` · `60 #992831` · `70 #8A212A` · `80 #701920` · `90 #470E13` · `100 #1F0608`

**Green (SG) — gain / buy / up**
`10 #C5EBCB` · `20 #99E0A5` · `30 #6FD681` · `40 #49CC5F` · `50 #03A61E` · `60 #1D862F` · `70 #177827` · `80 #116920` · `90 #0A5216` · `100 #052E0C`

**Blue (SB)**
`10 #D6E7FF` · `20 #ADCFFF` · `30 #85ADFF` · `40 #4784FF` · `50 #1B5DE0` · `60 #0051C2` · `70 #0044A3` · `80 #003785` · `90 #002A66` · `100 #001E47`

**Cyan (SC) — floor (giá sàn)**
`10 #F0FCFF` · `20 #D7EEF5` · `30 #A2D2E0` · `40 #72B7CC` · `50 #5DAAC2` · `60 #519FB8` · `70 #418CA3` · `80 #3F7C8F` · `90 #3B6B7A` · `100 #355A66`

**Magenta (SM) — ceiling (giá trần)**
`10 #FCF0FF` · `20 #F5CCFF` · `30 #EDA3FF` · `40 #E47AFF` · `50 #DD5BFE` · `60 #D73DFE` · `70 #D11EFE` · `80 #AB00D6` · `90 #8B00AD` · `100 #6A0085`

**Yellow (SY) — reference**
`50 #FFD400`

---

## 4. Color — neutrals

**Neutral ramp (N10 → N100), light mode**
`N10 #FFFFFF` · `N20 #F5F7FA` · `N30 #E4E6EB` · `N40 #D7DBE0` · `N50 #CBCFD6` · `N60 #C0C4CC` · `N70 #B4B9C2` · `N80 #A9AEB8` · `N90 #8E949E` · `N100 #43474D`

**Dark neutrals (product surfaces)**
`#000000` (page) · `#14171A` (card) · `#1C2229` (raised) · `#272C33` (table head) · `#2A333D` (hover/input) · `#2F353D` (hairline) · `#4D545C` (control border)

---

## 5. Semantic tokens — Dark theme (product default)

| Token | Value | Role |
|---|---|---|
| `--bg-app` | `#000000` | page background |
| `--bg-surface` | `#14171A` | cards / panels |
| `--bg-surface-2` | `#1C2229` | raised card |
| `--bg-heading` | `#272C33` | table / modal heading row |
| `--bg-elevated` | `#2A333D` | hover row / input |
| `--border` | `#2F353D` | hairlines, dividers |
| `--border-strong` | `#4D545C` | control borders |
| `--text-primary` | `#FFFFFF` | primary ink |
| `--text-secondary` | `#95A1AD` | secondary ink |
| `--text-tertiary` | `#607080` | tertiary / muted |
| `--text-disabled` | `#4D545C` | disabled |
| `--text-brand` | `#2681FF` | links |
| `--status-success` | `#00E500` | success |
| `--status-error` | `#FF0011` | error |
| `--status-warning` | `#FFD400` | warning |
| `--status-info` | `#2681FF` | info |
| `--overlay-hover` | `rgba(51,119,255,0.12)` | hover tint |
| `--overlay-pressed` | `rgba(51,119,255,0.20)` | pressed tint |
| `--scrim` | `rgba(0,0,0,0.60)` | modal scrim |

A **light theme** is available via `[data-theme="light"]` (surfaces `#FFFFFF` / `#F7F8F9`), but the trading product is dark-first.

---

## 6. Typography

**Family:** SF Pro Display (self-hosted, `fonts/`), weights 100–900 + italics. Fallbacks: Apple system stack, then Inter. Numerics use tabular lining figures (`font-variant-numeric: tabular-nums lining-nums`) for column alignment.
Base 16px → 8px x-height → 4px baseline.

| Style | Size / line | Weight |
|---|---|---|
| H1 | 64 / 72 | 700 |
| H2 | 52 / 60 | 700 |
| H3 | 44 / 52 | 700 |
| H4 | 36 / 44 | 700 |
| H5 | 32 / 40 | 600 |
| H6 | 28 / 36 | 600 |
| Body-LG | 24 / 32 | 400 |
| Body | 16 / 24 | 400 |
| Body-SM | 14 / 22 | 400 |
| Caption | 12 / 16 | 500 |
| Micro | 10 / 16 | 500 |

Weights: Regular 400 · Medium 500 · Semibold 600 · Bold 700.

---

## 7. Spacing, radius, elevation

**Spacing** — 8px grid, 4px baseline:
`4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 72 · 100` (px) = `--space-1 … --space-10`

**Radius:**
`xs 2px` (chips) · `sm 4px` (buttons/inputs — default) · `md 8px` (cards) · `lg 12px` · `xl 20px` (large containers) · `pill 100px` (badges/toggles)

**Elevation (z100 → z600)** — soft, cool, low-opacity `rgba(55,66,77,…)`:
- `z100` hairline `0 0 1px rgba(55,66,77,.40)`
- `z200` card-bg `0 2px 4px rgba(9,30,66,.08) …`
- `z300` raised `0 6px 12px rgba(9,30,66,.10) …`
- `z400` card `0 12px 20px rgba(55,66,77,.12) …`
- `z500` popover `0 16px 32px rgba(55,66,77,.32) …`
- `z600` modal `0 24px 48px rgba(0,0,0,.48) …`

---

## 8. Components (cosmetic spec)

- **Buttons** — MUA (green `--sg80`) / BÁN (red `--sr70`) trade CTAs in ALL CAPS; Primary `--brand`; Secondary neutral `#33383D`; Ghost (blue text). Sizes 28 / 36 / 44px, radius 4px.
- **Inputs** — 2px border `#4D545C`, radius 4px; focus turns `--brand` `#2681FF`; right-aligned chevron / clear icon.
- **Controls** — checkbox/radio/toggle; selected = brand blue, pressed = `#2F353D`; toggles are full pills.
- **Badges & tags** — count badges (pill), status tags (Khớp lệnh / Đã hủy / Chờ khớp), segmented tabs (Ngày / Tuần / Tháng).
- **Quote row** — the core price-board cell: ticker + reference/ceiling/floor + matched price/Δ/% + volume, each tinted by movement.

---

## 9. Iconography

Custom two-style set at a 24px frame: **Fill** and **Outline** variants (`*-filled` / `*-outlined`, Ant-Design-style naming). Trading triangles (`triangleUp/Down-filled`) are the most HSC-specific. **Currently substituted with [Lucide](https://lucide.dev) (CDN)** pending the real icon font. No emoji, ever. No decorative unicode.

---

## 10. Voice & content

- **Vietnamese-first** with full diacritics; English for universal finance terms & tickers (VNINDEX, P/E).
- Institutional, plain, functional. Labels are nouns, not marketing. Neutral/impersonal in-product; "bạn" only on marketing surfaces. Avoid "I".
- **Sentence case** headings/labels; single-word tabs Title-case; BUY/SELL CTAs ALL CAPS.
- Numbers everywhere: tabular figures, thousands separators, signed deltas (+18%), dates `DD/MM/YYYY`. Always pair a number with its movement color.
- Examples: "Hiệu suất danh mục", "Danh mục đầu tư · Danh mục tối ưu · VNINDEX", "Đặt lệnh", "Thông số hiệu suất danh mục".

---

## 11. Visual foundations (quick reference)

Dark by default on near-black. Saturated color reserved for price data + the one primary action; chrome stays desaturated neutral. Flat solid fills, **no gradients in-product** (only the marketing cover, and a subtle area-fade under chart lines). Hairline borders, restrained radii. Hover = subtle blue tint; press = denser fill; no scale-bounce. Animation minimal & quick (~120–200ms ease-out, value-flash on price ticks). The product is essentially imageless — data is the imagery. Chart strokes: portfolio magenta `#C552FF`, optimized blue `#2681FF`, VNINDEX amber.

---

## 12. Files in the system

- `colors_and_type.css` — canonical tokens (import first).
- `assets/` — logo / brand assets.
- `fonts/` — SF Pro Display (self-hosted).
- `preview/` — design-system reference cards.
- `ui_kits/terminal/` — interactive trading-terminal recreation (`index.html`).
- `README.md` — full brand/product context & foundations.
- `SKILL.md` — Agent-Skill manifest.

---

## 13. Caveats

- SF Pro Display is now self-hosted from licensed uploads.
- Icons substituted with Lucide pending HSC's real Fill/Outline set.
- `--brand` interactive blue (`#2681FF`) is independent of the updated SB scale — confirm whether it should repoint to SB40/SB50.
- Light theme is inferred; the product is dark-first.
