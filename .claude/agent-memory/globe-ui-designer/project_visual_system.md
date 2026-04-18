---
name: OSINT Globe Visual System
description: Core palette, CSS architecture, component patterns, and z-index layering for the war-theater-map HUD UI
type: project
---

## Palette

- Primary green: `#00ff41` (CSS `--green`, Tailwind `military.green`) — dominant text/border/glow color
- Amber: `#ffb000` (CSS `--amber`, Tailwind `military.amber`)
- Alert red: DIVERGENT — CSS `--red` is `#ff3333`; Tailwind `military.red`, `TYPE_COLORS.missile.primary`, and `IMPORTANCE_COLORS.critical` are all `#ff2222`. These need to be unified.
- Blue: `#0088ff` (CSS `--blue`, Tailwind `military.blue`)
- Background: pure `#000000` canvas; panels use `rgba(0,8,0,0.88)` (near-black with green tint)

## CSS Primitives (index.css)

- `.mil-panel` — `rgba(0,8,0,0.88)` + `backdrop-filter: blur(4px)`. Use on every HUD panel.
- `.border-glow` — 1px green border + outer/inset box-shadow. Paired with `.mil-panel` on interactive panels.
- `.glow` / `.glow-red` / `.glow-amber` / `.glow-blue` — text-shadow neon bloom utilities.
- `.event-label` — used for inline Globe3D HTML marker labels (10px Courier, green, pointer-events: none).
- `.ticker-track` — 320s linear translateX for news ticker; pauses on hover.
- `body::after` — CRT scanline overlay, z-index 9999, covers entire viewport.

## Dynamic color pattern

All event-type-specific colors come from `src/utils/colors.js`. In JSX: inline `style` props using `${typeColor}22`/`44`/`55` for alpha variants. Tailwind cannot generate classes from runtime values — this inline pattern is correct and intentional.

## Z-index layering

- 0: Globe3D canvas (absolute inset-0)
- 20: NewsFeed ticker
- 30: Header, EventCard, Timeline, Legend, active-ops badge
- 40: Campaign selector dropdown
- 50: VideoModal
- 9999: CRT scanline (body::after)

## Component patterns established

- `Header`, `Legend`, `NewsFeed` are all wrapped with `React.memo` — do not add redundant memoization inside them.
- Header accepts `activeEvents` prop (the full array from `useSimulation`) and reads `.length` for the ACTIVE OPS chip. Never hardcode that count again.
- `useNews()` destructures both `headlines` and `error` (aliased `newsError`) — `newsError` is passed to NewsFeed. If adding more hooks that can error, follow this pattern: destructure error, alias it, pass down as a named prop.
- `NewsFeed` shows a `FEED ERR` badge inside the source label block when `newsError` is truthy. The badge sits after the "LIVE NEWS" text, inside the same `flex-shrink-0` left-side block.
- `vercel.json` at project root rewrites all routes to `/index.html` for SPA routing — this file must not be removed or it will break deep-link navigation on Vercel.

## Globe configuration

- `globeImageUrl`: earth-night.jpg (currently from unpkg CDN — should be self-hosted in public/textures/)
- `backgroundImageUrl`: night-sky.png (same CDN issue)
- `atmosphereColor`: `#00cc44` (green, matches HUD theme — not realistic blue)
- `atmosphereAltitude`: 0.18
- Initial POV: `{ lat: 31, lng: 44, altitude: 1.3 }` — Middle East theater, close cinematic angle

## Tailwind extensions (tailwind.config.js)

- `military.*` colors defined but underused in JSX (components use standard green-*/red-* variants)
- `scan` and `blink` keyframes defined but unused in any component
- `ticker` animation duplicates the one in index.css

**Why:** The `military.*` tokens were added early but components defaulted to standard Tailwind variants. Scan/blink were planned features never wired up.
**How to apply:** When adding new components, prefer `military.*` tokens for consistency. Use `scan` for loading overlays, `blink` for the LIVE indicator if enhancing those components.
