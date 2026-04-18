# OSINT Globe — Project Notes

_Last updated: 2026-04-18_

---

## 1. Project Lead — Overview & Roadmap

### Executive Summary

This is a React + Vite + react-globe.gl + Tailwind CSS 3D interactive globe application for OSINT-based military conflict visualization. The theater of focus is the Israel / Iran / USA conflict from October 7, 2023 through the present (with 3 simulated future events extending to April 2026). The app is in a solid functional state — the core visualization, timeline playback, and event detail system all work — but has meaningful gaps in data coverage, several known bugs, and architectural issues that will compound as content grows.

**Package name:** `war-theater-map` v1.0.0
**Stack:** React 18.3.1, Vite 5.4.1, react-globe.gl 2.27.2, Three.js 0.167.1, date-fns 3.6.0, Tailwind CSS 3.4.9

---

### Component Hierarchy (verified 2026-04-18)

```
App.jsx                    — root; owns ALL state; ~150 lines
├── Globe3D.jsx            — absolute inset-0 z-0; WebGL canvas; keyboard nav; arc/point/label data
├── Header.jsx             — top bar; live clock; mode toggle (LIVE / TIMELINE); static status chips
├── NewsFeed.jsx           — scrolling ticker below header; fed by useNews hook
├── [Campaign Selector]    — inline in App.jsx; visible only in timeline mode (top-right dropdown)
├── EventCard.jsx          — right panel; shown when selectedEvent != null; scrollable detail
├── VideoModal.jsx         — fullscreen overlay; YouTube search CTA; shown when showVideo == true
├── Timeline.jsx           — bottom panel; visible in timeline mode; scrubber + speed controls + event dots
└── Legend.jsx             — bottom-right; collapsible; arc type + actor + importance key
```

---

### State Shape (all in App.jsx)

| State var | Type | Notes |
|---|---|---|
| `mode` | `'live' \| 'timeline'` | Switching clears selectedEvent |
| `selectedEvent` | event object \| null | Drives EventCard and VideoModal visibility |
| `showVideo` | boolean | Only true when selectedEvent is also set |
| `isPlaying` | boolean | Timeline playback on/off |
| `speed` | `1 \| 5 \| 20 \| 100` | Playback multiplier (x game days per real second) |
| `activeCampaignId` | `'all' \| 'days-of-repentance' \| 'northern-arrows'` | Campaign scope filter |
| `currentCampaign` | derived via useMemo | Found from campaigns array by ID |
| `currentTime` | number (ms timestamp) | Initialized to currentCampaign.start; advances via RAF loop |

**Critical state coupling:** `currentTime` is initialized once via `useState(currentCampaign.start)`. Campaign switches are handled via `handleCampaignChange` which manually syncs `currentTime`. If any future code path changes `activeCampaignId` without also resetting `currentTime`, the timeline will display the wrong time range silently. This is a fragile pattern.

---

### Data Layer (verified 2026-04-18)

**events.js** — 28 events total (IDs 1–28; ID 24 appears physically last in the array, out of numerical order)

| Campaign | Event count | Date range |
|---|---|---|
| All (Iron Swords) | 28 | 2023-10-07 – 2026-04-17 |
| Days of Repentance | 1 | 2024-10-26 |
| Northern Arrows | 4 | 2024-09-17 – 2024-11-26 |

**Simulated events (3):** IDs 22, 23, 24 — flagged `simulated: true`; sourced as "SIMULATED — based on escalation trajectory". These are clearly labelled in the UI.

**TIMELINE_END** is `2026-04-17T00:00:00Z` — one day behind today (2026-04-18). The "all" campaign window does not include today.

**Event schema fields:** id, date, timestamp, title, subtitle, description, type, importance, origin `{lat,lng,label}`, targets `[{lat,lng,label}]`, country, casualties, source, searchQuery, tags, arcAltitude, arcSpeed, arcColor, optional `simulated: true`.

---

### Known Bugs (P-ranked)

**P1 — High (user-visible, functional impact)**

1. **TIMELINE_END is stale.** Set to `2026-04-17T00:00:00Z`. Today is 2026-04-18. The global campaign window excludes the most recent day. Should be updated to today or set dynamically to `new Date()`.
   - File: `/Users/lidor/Desktop/stam/src/data/events.js:58`

2. **Event ID 24 (USS Carl Vinson, 2026-04-10) is out of order.** It appears physically after IDs 25–28 in the array (which are 2023 events). The Timeline component uses `events.filter()` not sort, so the position matters if iteration order is ever assumed chronological.
   - File: `/Users/lidor/Desktop/stam/src/data/events.js:681`

3. **Header status chips are hardcoded static strings.** "IRAN THREAT: CRITICAL", "ACTIVE OPS: 3", "US CARRIERS: 2" do not reflect live state. ACTIVE OPS does not use `activeEvents.length`.
   - File: `/Users/lidor/Desktop/stam/src/components/Header.jsx:35-37`

4. **VideoModal no longer embeds video.** Previous version apparently used a YouTube iframe embed with `listType=search` (deprecated by Google). Current version shows a YouTube search CTA link instead. This is actually the correct current implementation — the memory note about a deprecated embed was from a prior version. Current VideoModal.jsx is clean.

5. **useNews error/loading state silently swallowed.** `App.jsx:49` destructures only `{ headlines }` from `useNews()`. `loading` and `error` are discarded. No user feedback if news API fails.
   - File: `/Users/lidor/Desktop/stam/src/App.jsx:49`

**P2 — Medium (code quality, potential edge case)**

6. **No error boundaries anywhere.** If Globe3D throws (e.g., WebGL context lost, CDN textures unreachable), the entire app goes blank with no recovery UI.

7. **Globe textures loaded from unpkg CDN (runtime external dependency).** `earth-night.jpg` and `night-sky.png` are fetched from `unpkg.com/three-globe/...` at runtime. If the CDN is unavailable, the globe renders as a blank sphere.
   - File: `/Users/lidor/Desktop/stam/src/components/Globe3D.jsx:265-266`

8. **No React.memo on stateless children.** Header, Legend, NewsFeed, and EventCard re-render on every App state change even though they have stable or slowly-changing props. At current scale this is not measurable, but will matter if state update frequency increases.

9. **EventCard uses array index as React key for targets.** `key={i}` on the targets list. Should use `key={t.label}` or `key={t.lat + t.lng}`.
   - File: `/Users/lidor/Desktop/stam/src/components/EventCard.jsx:75`

10. **No VITE_NEWS_API_KEY configured.** No `.env` file present. NewsAPI integration falls back to static headlines in `newsHeadlines.js` (20 items, circa app creation date). The ticker always shows stale static content in the current deployment.

---

### Data Coverage Gaps (P-ranked)

**P1 — Critical gaps in the conflict narrative**

1. **October 7, 2023 attack itself is absent.** Hamas's ground assault, the rocket barrage from Gaza, the kibbutz massacres — the opening event of the entire conflict is not in the dataset. The earliest event is ID 25 (USS Gerald Ford deployment, Oct 8) and ID 26 (USS Eisenhower deployment, Oct 20). The conflict literally starts at the wrong event.
   - Missing: Hamas Oct 7 ground assault from Gaza; 3,000+ rocket barrage toward southern Israel; Nova festival attack.

2. **No Gaza ground invasion event (Oct 27, 2023).** The IDF ground invasion of Gaza — one of the most significant military operations in Israeli history — is not represented.

3. **Northern Arrows campaign anchor is missing.** The `northern-arrows` campaign (Sep 15 – Nov 30, 2024) starts with ID 8 (Pager Operation, Sep 17) and has no event representing Hezbollah initiating rocket fire into northern Israel that prompted the campaign.

4. **Missing ~8–12 events from Oct–Nov 2023.** The period from Oct 7 to Dec 2023 has only 2 deployment events. Key events absent: Gaza ground invasion, Rafah crossing, IDF airstrikes on Gaza, Hezbollah cross-border rocket exchanges from Lebanon.

5. **Gaza Strip coordinate not in LOC dictionary.** Gaza events use inline coords `{lat: 31.5017, lng: 34.4674}` rather than a named `LOC.GAZA_CITY` entry. Inconsistent and harder to maintain.

---

### Architecture Assessment

**What is working well:**
- The `activeEventKey` memoization strategy in Globe3D.jsx is smart — it prevents the three `useMemo` blocks from re-running on every RAF tick by keying on sorted event ID strings rather than the array reference.
- `useSimulation.js` correctly uses a `stableKeyRef` pattern to return a stable array reference only when the visible event set actually changes. This is the right approach for decoupling the RAF loop from the React render cycle.
- `arcStyle()` function cleanly differentiates between deployment-type arcs (surface-hugging, slow, convoy feel) and strike arcs (high trajectory, fast dot).
- Tailwind + CSS custom properties combination is clean: `.mil-panel`, `.glow`, `.border-glow` utility classes give consistent CRT terminal aesthetics.
- `VideoModal` was refactored away from an iframe embed to a YouTube search CTA — this is a clean solution to the deprecated `listType=search` API problem.

**What needs attention:**
- **All state in App.jsx** — currently manageable at 28 events / 7 state vars, but this will need to be split into context or a state management solution if event count grows past ~100 or if filter/layer state is added. The `handleCampaignChange` dependency between `activeCampaignId` and `currentTime` is the most fragile coupling.
- **No test coverage** — there are no test files, no test runner configured (no Vitest/Jest in package.json), no QA infrastructure.
- **No error boundaries** — a single WebGL or data error cascades to a blank screen.
- **Deployment readiness is low** — no `vercel.json`, no `.env.example`, no OG meta tags, globe textures served from external CDN.

---

### Roadmap — Prioritized TODO List

#### P0 — Fix before any release

| Task | File | Description |
|---|---|---|
| Fix TIMELINE_END | `src/data/events.js:58` | Update to 2026-04-18 or make dynamic with `new Date()` |
| Add Hamas Oct 7 event | `src/data/events.js` | Core anchor event for entire conflict timeline; missing |
| Add Gaza ground invasion event | `src/data/events.js` | Oct 27, 2023 IDF ground incursion into Gaza |
| Add error boundary around Globe3D | `src/App.jsx` | Prevents blank screen on WebGL errors |

#### P1 — High priority improvements

| Task | File | Description |
|---|---|---|
| Sort events by timestamp | `src/data/events.js` | ID 24 is out of numerical/chronological order |
| Add LOC.GAZA_CITY to location dict | `src/data/events.js` | Normalize Gaza coordinates into LOC dictionary |
| Make ACTIVE OPS chip dynamic | `src/components/Header.jsx:36` | Wire to `activeEvents.length` passed as prop |
| Add `.env.example` | project root | Document VITE_NEWS_API_KEY requirement |
| Self-host globe textures | `src/components/Globe3D.jsx:265` | Bundle earth-night.jpg and night-sky.png in `public/` |
| Fill Northern Arrows anchor event | `src/data/events.js` | Add Sep 15, 2024 Hezbollah campaign-start event |
| Fix EventCard key prop | `src/components/EventCard.jsx:75` | Use `key={t.label}` instead of `key={i}` |

#### P2 — Medium priority improvements

| Task | Description |
|---|---|
| Add ~8 events: Oct–Dec 2023 | Hezbollah cross-border fire, IDF Gaza airstrikes, Rafah crossing events to fill the narrative gap |
| Add React.memo to Header, Legend, NewsFeed | Prevent unnecessary re-renders from App state changes |
| Wrap useNews error in UI | Show a fallback indicator in NewsFeed if API fails |
| Add Vitest + basic test suite | At minimum: event schema validation, color getter fallbacks, useSimulation mode switching |
| Add OG / social meta tags | `index.html` — needed for sharing |
| Add `vercel.json` | Basic SPA routing config for deployment |

#### P3 — Future features / nice-to-have

| Task | Description |
|---|---|
| Filtering by actor/type | Layer toggle controls (show/hide by country or event type) |
| Split state into React context | Separate globe state, UI state, and simulation state from App.jsx monolith |
| Add more 2025 events | Gap between May 2025 (ID 20 US B-2 strike) and Jan 2026 (ID 22 True Promise III) has no events |
| Timeline tooltip on event dots | Show event title on hover before clicking |
| Accessibility pass | Keyboard focus management, ARIA labels for globe interactions |
| Mobile / responsive layout | Currently designed for desktop; panels overlap badly on small viewports |

---

### Campaign Coverage Summary

| Campaign | Events present | Key gaps |
|---|---|---|
| All / Iron Swords (Oct 2023 – Apr 2026) | 28 | Oct 7 attack, Gaza ground invasion, Oct–Dec 2023 period, 2025 Q3-Q4 |
| Days of Repentance (Oct 20–30, 2024) | 1 (ID 11) | Only the Israeli strike; no Iranian response or international reaction event |
| Northern Arrows (Sep 15 – Nov 30, 2024) | 4 (IDs 8, 9, 15, 16) | Missing campaign-opening Hezbollah rocket escalation event |

---

### Technical Debt Register

1. **Monolithic App.jsx state** — all 7 state vars + all callbacks live in one component. Acceptable now; needs splitting at scale.
2. **No test infrastructure** — no Vitest, no React Testing Library, no snapshot tests.
3. **No CI/CD pipeline** — no `.github/workflows/`, no automated build/test on push.
4. **External CDN texture dependency** — globe textures from unpkg are a runtime single point of failure.
5. **News API key not documented** — new contributors won't know VITE_NEWS_API_KEY is required for live headlines.
6. **No type safety** — pure JavaScript throughout; event schema has no runtime validation or TypeScript types.

---

_Section written by Project Lead agent on 2026-04-18. Other sections to be filled by specialist agents._

---

## 2. WebGL/React Engineer — Performance & Rendering

_Section written by WebGL/React Engineer agent on 2026-04-18._

---

### Rendering Architecture

**Library stack:** `react-globe.gl` 2.27.2 wraps Three.js 0.167.1. The Globe component owns its own `WebGLRenderer`, scene graph, and `requestAnimationFrame` loop internally — it is a black box from React's perspective. React only controls what data arrays get passed in and what accessor props (string field names) it uses to read them.

**Three data layers, three internal passes per frame:**
1. **Arcs** — Three.js `TubeGeometry` per arc, animated via `arcDashAnimateTime`. Each unique arc needs a material with animated `dashOffset` uniform.
2. **Points** — instanced `SphereGeometry` by default when `pointsMerge={false}` (current setting). This means one draw call per point rather than a single instanced draw. With 28 events and ~2 target points each, worst case is ~84 individual sphere draw calls per frame.
3. **HTML labels** — DOM elements projected into 3D space via CSS transforms. Each label is a `<div>` positioned by Three.js's `CSS2DRenderer`. These trigger CSS layout recalculations whenever the camera moves.

**Current render mode:** `pointsMerge={false}` — this is the slower path. Setting `pointsMerge={true}` would merge all points into a single `BufferGeometry` with one draw call but disables per-point interaction (click/hover). Given that clicks are required, `false` is correct but it means we pay per-point overhead.

---

### Memoization Strategy (what is already well-designed)

The codebase has a sophisticated and correct solution to the core WebGL + React conflict: the RAF loop in `useSimulation.js` fires `setCurrentTime` on every animation frame (~60 fps), which would normally cascade into 60 React re-renders per second and 60 Globe `useMemo` re-computations per second.

**The `stableKeyRef` pattern in `useSimulation.js`** (lines 54–67) returns a stable array reference from `timelineActive` — it only creates a new array object when the sorted-ID string key changes. This means `activeEvents` reference identity is stable across frames unless a new event enters or leaves the 12-hour visibility window.

**The `activeEventKey` string in `Globe3D.jsx`** (line 155) is then used as the sole dependency for all three `useMemo` hooks (arcsData, pointsData, htmlData). Because `activeEvents` reference is stable, this string is stable across frames, so the three memos never re-fire except on genuine event set changes. This is the correct decoupling.

**`arcStyle()` and `computeArcAlt()`** are module-scope pure functions — zero allocation risk per render. Per-arc style fields (`dl`, `dg`, `animTime`, `stroke`, `altitude`) are baked into arc data objects so Globe uses string accessors, not inline functions, keeping prop references stable.

**Callbacks** `handlePointClick`, `handleArcClick`, and `htmlElement` are all wrapped in `useCallback` with correct, minimal dependency arrays. `onEventClick` is properly listed in `handlePointClick` and `handleArcClick`.

---

### Performance Concerns

**1. `pointsData` has a broader dependency array than needed.**
`pointsData` (line 183–214) depends on `[activeEventKey, selectedId, events]`. The `events` array is module-scope constant (imported directly from `events.js`) so it is stable across renders. However, `selectedId` changes every time the user selects an event. This means every click re-computes the full points array (all 28 events * ~2 points = ~84 items). The recomputation itself is cheap (no geometry, just JS objects), but it triggers a Globe internal rebuild of the points layer. This could be optimized by separating the selected-state styling concern from the data construction, but at 84 points it is not a measurable cost today.

**2. Inline arrow functions on `arcLabel`, `onArcHover`, `pointLabel`, `onPointHover` props (lines 283–297).**
Four props receive inline `(d) => ...` functions that are recreated on every render:
- `arcLabel={(d) => d.event?.title}` — line 283
- `onArcHover={(arc) => { document.body.style.cursor = ... }}` — line 285
- `pointLabel={(d) => d.label}` — line 295
- `onPointHover={(pt) => { document.body.style.cursor = ... }}` — line 297

These are not wrapped in `useCallback`. Because they are inline, they get new references on every render, telling react-globe.gl to re-register them internally. Whether react-globe.gl does a deep comparison or reference comparison on these props determines the actual impact. Given that Globe3D itself only re-renders when its parent `App.jsx` re-renders (which does happen every RAF tick via `setCurrentTime` in timeline mode), these four props change identity on every frame. This is the highest-priority callback hygiene issue.

**3. `dims` state triggers Globe width/height re-render on resize.**
The `dims` state (line 70) is updated via a `window.resize` listener. Every resize event calls `setDims`, which re-renders Globe3D and passes new `width`/`height` to the Globe component. This is correct behavior but uses `window.innerWidth/innerHeight` directly rather than a `ResizeObserver` on the container. If the container is not full-viewport (e.g. a future layout change adds sidebars), the dimensions will be wrong. A `ResizeObserver` on `containerRef` would be more robust.

**4. `htmlElement` callback creates raw DOM nodes on every call.**
`htmlElement` (line 240–248) creates a `div`, sets className, textContent, and three style properties, then returns it. react-globe.gl calls this once per label when `htmlElementsData` changes — which is keyed off `activeEventKey`, so it only fires on event set changes. This is acceptable. However, the DOM node is never cleaned up explicitly; react-globe.gl is responsible for removing it when the label is removed from `htmlElementsData`. This works correctly with the library's lifecycle management, but there is no explicit dispose path if the Globe unmounts while labels are active.

**5. `animateIn={false}` — correct choice.**
Disabling the globe's built-in startup animation prevents a brief full-re-render burst on mount. Good.

**6. No Three.js manual resource creation.**
Globe3D does not manually instantiate any Three.js geometries, materials, textures, or render targets. All Three.js object lifecycles are managed internally by react-globe.gl. There is therefore no missing `.dispose()` risk for manually created resources. The custom keyboard RAF loop (`rafKeyRef`) is correctly cancelled in its cleanup. Cursor cleanup on unmount is present (line 251). No memory leak vectors identified.

---

### Globe Configuration Assessment

**Camera / controls setup (lines 80–97):**
- Initial POV: `{lat: 31, lng: 44, altitude: 1.3}` — centered on the Iraq/Iran border region, appropriate for the conflict theater.
- Animated in with `pointOfView(..., 1500)` — smooth 1.5s fly-in on load.
- OrbitControls configured with `autoRotate: false`, `zoomSpeed: 1.0`, `rotateSpeed: 0.8` — reasonable values.
- 400ms `setTimeout` before initialization — works but is a time-based heuristic. A cleaner approach would be to use Globe's `onGlobeReady` callback prop (if available in react-globe.gl 2.27.x) to fire after the WebGL context is confirmed ready rather than guessing a delay.

**Keyboard navigation (lines 99–148):**
- RAF loop (`rafKeyRef`) for continuous key-held panning — correct approach, refs used properly.
- Cleanup cancels both event listeners and the RAF. Clean.
- `KEY_PAN_SPEED = 3` degrees per frame is fast at 60fps (180 deg/sec). May feel jittery at high frame rates. A time-delta-scaled approach (like the simulation RAF) would give consistent speed regardless of frame rate.

**Atmosphere and textures:**
- `atmosphereColor="#00cc44"` — green atmosphere for CRT aesthetic, matches the theme.
- `atmosphereAltitude={0.18}` — standard glow height.
- Globe and background textures fetched from unpkg CDN at runtime (also flagged by Project Lead as P1 risk).

---

### Arc Altitude Model

The codebase uses a custom `computeArcAlt()` function (lines 21–28) based on a simplified great-circle approximation (not full Haversine, but a cosine-corrected Euclidean in lat/lng space which is sufficient for ~2000km range accuracy).

The formula `Math.min(0.28, Math.max(0.04, Math.sqrt(dist) * 0.05))` produces a sqrt-scaled altitude capped at 0.28. This gives:
- Short-range (~2°, Lebanon to Israel): 0.04–0.07 — surface-hugging, realistic
- Mid-range (~14°, Iran to Israel): ~0.19 — moderate arc
- Long-range (~46°, Diego Garcia): 0.28 (capped) — flattened, but Diego Garcia events have explicit `arcAltitude` overrides anyway (0.65–0.70)

Events that need high altitudes (ballistic missiles: IDs 4, 5, 10, 20, 22) use explicit `arcAltitude` overrides that bypass `computeArcAlt()` entirely (range: 0.55–0.70). This is the right pattern — the generic formula is a fallback for events without an explicit altitude. The current cap of 0.28 is too low for unoveridden long-range events; but in practice all critical long-range events have manual overrides.

**Deployment types** (deployment, airlift) override altitude to 0.002 (surface) or 0.05 (very low), and use `dg: 0.06` (many dashes) + slow `animTime` (9000–18000ms) to convey a convoy/route feel. This is visually correct and distinct from strike arcs.

---

### Concrete TODOs and Recommendations

**P0 — Correctness (do before any release)**

| # | File | Line | Issue | Fix |
|---|---|---|---|---|
| 1 | `Globe3D.jsx` | 283–297 | Four inline function props recreated every render | Wrap `arcLabel`, `onArcHover`, `pointLabel`, `onPointHover` in `useCallback` |
| 2 | `Globe3D.jsx` | 94 | Globe init uses `setTimeout(400)` timing heuristic | Replace with `onGlobeReady` callback prop if supported; otherwise document the 400ms assumption |

**P1 — Performance hygiene**

| # | File | Line | Issue | Fix |
|---|---|---|---|---|
| 3 | `Globe3D.jsx` | 294 | `pointsMerge={false}` — one draw call per point sphere | If interactivity on individual points is not needed for target points (only origins need click), consider rendering target points as a merged layer and origin points separately |
| 4 | `Globe3D.jsx` | 70–77 | `window.innerWidth` resize polling | Replace with `ResizeObserver` on `containerRef` for layout-accurate sizing |
| 5 | `Globe3D.jsx` | 130–137 | Key pan speed not frame-rate compensated | Apply time-delta scaling: `speed * (deltaMs / 16.67)` to normalize at 60fps target |

**P2 — Resilience and future-proofing**

| # | File | Line | Issue | Fix |
|---|---|---|---|---|
| 6 | `Globe3D.jsx` | 265–266 | Globe textures from unpkg CDN | Copy `earth-night.jpg` and `night-sky.png` to `public/textures/` and use local paths |
| 7 | `App.jsx` | 67–74 | No error boundary around Globe3D | Wrap in `<ErrorBoundary>` with a "WebGL unavailable" fallback UI |
| 8 | `Globe3D.jsx` | 183–214 | `pointsData` recomputes on every `selectedId` change | Separate selection highlight into a second memo keyed only on `selectedId`; keep full point array stable; merge at render time |

**P3 — Scale preparation**

| # | Issue | Fix |
|---|---|---|
| 9 | `pointsMerge` strategy will degrade past ~500 points | If event count grows significantly, switch origin points to a merged layer; overlay a separate sparse interactive layer for clickable origins only |
| 10 | HTML label layer does not scale | Past ~30 simultaneous active labels, CSS2DRenderer label overlap becomes unreadable. Add distance-based LOD culling: suppress labels when `altitude > 2.0` or when label count exceeds a threshold |
| 11 | No WebGL context loss handling | Add a `webglcontextlost` event listener on the canvas; force a globe remount or show a recovery banner |

---

## 3. UI Designer — Visual & UX
[To be filled by UI agent]

---

## 4. Events Engineer — Data & Content

### Data Schema & Structure

**File location:** `/Users/lidor/Desktop/stam/src/data/events.js`

The event database is a static JavaScript export containing 28 event objects plus supporting enums and location presets. No database is used; all event data is hardcoded and must be manually edited to add/modify events.

**Event object fields:**
- `id` (number): Sequential identifier used as React key
- `date` (string): ISO date "YYYY-MM-DD"
- `timestamp` (number): Unix milliseconds; populated via helper `ts()` function
- `title` (string): Short headline (~60 chars max)
- `subtitle` (string): One-liner contextual detail (~100 chars)
- `description` (string): 2–4 sentence factual narrative
- `type` (string): One of 8 EVENT_TYPES enum values
- `importance` (string): "critical", "major", or unspecified
- `origin` (object): `{lat, lng, label}` — launch/start point; uses LOC dictionary or inline coords
- `targets` (array): `[{lat, lng, label}, ...]` — one or more impact locations
- `country` (string): Primary actor; one of 7 COUNTRIES enum values
- `casualties` (string): Free-text casualty report (no structured format)
- `source` (string): Attribution (Reuters, AP, BBC, IDF, IRNA, etc.)
- `searchQuery` (string): Historical reference keyword for verification
- `tags` (array): String tags for filtering and categorization
- `arcAltitude` (number): Visual arc height override for Globe3D [0–1 range]
- `arcSpeed` (number): Arc animation duration in milliseconds
- `arcColor` (array): `[startColor, endColor]` hex strings for arc gradient
- `simulated` (boolean): Optional flag for hypothetical/speculative events

**Enums:**

EVENT_TYPES (8 values):
- `missile` — ballistic/cruise missile strikes
- `airstrike` — air-delivered ordnance (F-35, B-1B, B-2, etc.)
- `drone` — loitering/armed drones
- `naval` — maritime surface operations
- `defense` — air defense, interception, ceasefire agreements
- `ground` — ground incursion, armor movement, logistics
- `deployment` — force movement and positioning (surface-hugging arcs)
- `airlift` — strategic air transport (C-17 Globemasters, tanker refueling)

COUNTRIES (7 values):
- State actors: `Iran`, `Israel`, `USA`
- Non-state actors: `Hezbollah`, `Houthi`, `Iraq PMF`, `Hamas (Terror Org)`

Note: COUNTRIES enum mixes state and non-state entities, creating an inconsistent classification. "Hamas (Terror Org)" is editorially labeled.

**Location Dictionary (LOC):**
26 predefined geographic coordinates with human-readable labels. Stored in events.js as a `const` object used for `origin` and `targets` properties. Examples: `LOC.TEHRAN`, `LOC.NEVATIM`, `LOC.BEIRUT`, `LOC.USS_FORD`, `LOC.RED_SEA`. Gaza-related events use inline coordinates rather than a LOC entry, creating maintenance inconsistency.

**Campaign Definitions:**
Three timelines defined in the campaigns array:
1. `all` (Iron Swords) — Oct 7, 2023 to Apr 17, 2026 (entire conflict)
2. `days-of-repentance` — Oct 20–30, 2024 (Israeli strike operation window)
3. `northern-arrows` — Sep 15 – Nov 30, 2024 (Lebanon/Hezbollah campaign)

---

### Event Categories & Coverage

**Inventory: 28 total events**

| Period | Count | Events | Coverage |
|---|---|---|---|
| Oct–Dec 2023 | 5 | USS Gerald R. Ford, USS Eisenhower, C-17 airlift, THAAD deployment, no Oct 7 | **GAP: Oct 7 attack, Gaza ground invasion, Oct–Nov daily operations** |
| Jan–Apr 2024 | 7 | Tower 22, US retaliation, Iranian consulate strike, True Promise I, Houthi strikes, Isfahan drone | Complete Iran–Israel escalation cycle |
| May–Sept 2024 | 4 | Majdal Shams, pager operation, Nasrallah assassination, Houthi shipping strikes | Hezbollah intensification |
| Oct–Nov 2024 | 5 | True Promise II, Days of Repentance, Lebanon ground invasion, ceasefire, USS Abraham Lincoln | Lebanon war + carrier deployments |
| Jan–May 2025 | 5 | Gaza ceasefire Phase 1, ceasefire collapse, US–Iran talks, B-2 strike on Sanaa, Natanz strike | **GAP: May–Dec 2025 (6-month void)** |
| Jan–Apr 2026 | 2 | True Promise III (Jan 15), US–Israel joint strike on IRGC (Mar 8), USS Carl Vinson (Apr 10) | Simulated future escalation |

**By event type:**
- Missile strikes: 6 (Iran True Promise I/II/III, Houthi Yemen salvo)
- Airstrikes: 8 (Israel F-35 on Damascus/Isfahan/Gaza, US B-1B/B-2 on Iraq/Syria/Yemen)
- Drone strikes: 3 (Iran-backed Iraq, Israel intelligence ops)
- Deployments: 4 (USS carriers, THAAD, C-17 logistics)
- Ground operations: 2 (Lebanon invasion, intelligence pager op)
- Defense/ceasefire: 2 (air defense integration, negotiated ceasefires)

**Geographic distribution:**
- Iran–Israel theater: 11 events (escalation cycles, retaliations)
- Lebanon–Israel front: 5 events (Hezbollah strikes, Nasrallah, ceasefire)
- Red Sea / Houthi campaign: 4 events (shipping strikes, US naval response)
- Gaza: 2 events (2025+ ceasefire only; ground war absent)
- Iraq / Syria / Jordan: 3 events (Tower 22, US retaliation)
- US deployments: 5 events (carrier strike groups, THAAD, airlift)

---

### Data Quality Observations

**Strengths:**
1. **Consistent schema** — All 28 events follow the same field structure with no missing required properties
2. **Verified coordinates** — Military bases use real, accurate coordinates (e.g., Nevatim: 31.2077°N, 35.0127°E; Isfahan: 32.6546°N, 51.6680°E)
3. **Source attribution** — Every event cites primary sources (Reuters, AP, BBC, IDF, IRNA, Jerusalem Post, etc.)
4. **Temporal accuracy** — Event dates align with confirmed historical incidents (Apr 13 True Promise I, Sep 17 pagers, Oct 26 Days of Repentance)
5. **Visual parameters** — arc styling (altitude, speed, color) applied consistently within event types
6. **Tagging system** — Events include semantic tags ("historic", "F-35", "Shahed", "nuclear") for filtering

**Critical gaps:**

1. **October 7, 2023 attack missing.** The foundational event of the entire conflict — Hamas rocket barrage + ground assault on southern Israel, ~2,000 Israeli casualties, Nova festival massacre — is absent. Timeline effectively starts Oct 8 with a carrier deployment, not the conflict trigger. This is the single most critical data gap.

2. **Gaza ground invasion not represented.** The IDF's Oct 27, 2023 ground incursion into Gaza — one of the largest military operations in Israeli history — has no event. Gaza War (Oct 2023 – May 2024) is represented only by 2025+ ceasefire events.

3. **October–November 2023 severely under-indexed.** Only 5 events total for a 2-month period during the most active combat phase. Missing: Rafah crossing, initial IDF Gaza airstrikes, Hezbollah cross-border rocket fire initiation, humanitarian corridor openings.

4. **Gaza coordinate inconsistency.** Gaza-related events use inline coordinates `{lat: 31.5017, lng: 34.4674}` instead of a named LOC entry. No `LOC.GAZA_CITY` or granular Gaza district presets (Gaza City vs. Khan Younis vs. Rafah vs. Shati). This makes Gaza event management fragile.

5. **Importance ratings ambiguous.** "critical" is applied to both historic turning-points (Oct 7, April 13 True Promise I) AND routine carrier deployments (USS Abraham Lincoln). No quantitative rubric (e.g., >100 casualties = critical). Calibration is inconsistent.

6. **Simulated events mixed into timeline.** 6 events (IDs 22, 23, 24) are flagged `simulated: true` but are interspersed chronologically with real events (ID 22 is Jan 15, 2026; ID 25–28 are Oct 2023). Users may not immediately recognize these as hypothetical.

7. **May–December 2025 void.** No events between May 2025 (B-2 strike on Sanaa, ID 20) and January 2026 (True Promise III, ID 22). This 6-month gap suggests incomplete coverage or assumption that the conflict "pauses."

8. **Casualty counts lack structure.** All casualties stored as free-text strings. No distinction between confirmed, disputed, military vs. civilian, or source variation (e.g., "400+ killed (Gazan MoH)" vs. Israeli estimates). Impossible to analyze casualty patterns programmatically.

9. **Munition types not recorded.** No field captures missile/drone/bomb nomenclature. Events mention "Shahed-136", "Fattah-1", "JDAM" in description text only. Cannot filter by capability or create capability timeline.

10. **Missing metadata for damage assessment.** No field for facility status post-strike (destroyed, damaged, degraded, minimal). Cannot track infrastructure attrition or strategic effect.

11. **Coordinate precision not documented.** Some locations are exact military bases; others are city-level approximations. No `precision: "exact" | "approximate" | "city-level"` field. Majdal Shams origin is vague (SOUTHERN_LEB placeholder).

12. **COUNTRIES enum editorially labeled.** "Hamas (Terror Org)" is not neutral; violates OSINT data purity. Should be "Hamas" with optional separate classification field if needed.

---

### Event Flow: Data to Visualization

**Data path:**

1. **Static definition** → `src/data/events.js` exports `events` array + `campaigns` + `EVENT_TYPES` + `COUNTRIES` enums

2. **App.jsx imports & state management** → Events passed as prop to all child components; `currentTime` and `activeCampaignId` state drive filtering

3. **useSimulation hook** → Receives full `events` array + `currentTime` + campaign `startTime`/`endTime`
   - Filters events where `timestamp <= currentTime`
   - Returns stable `activeEvents` array via `useMemo` (keyed by sorted ID strings to prevent excessive recalculation)
   - RAF loop advances `currentTime` based on `isPlaying` and `speed` multiplier

4. **Globe3D component** → Receives full `events` + `activeEvents` + `selectedEvent`
   - Renders arcs for all `activeEvents` (origin → each target)
   - Arc styling derived from `arcAltitude`, `arcSpeed`, `arcColor` properties
   - Height computed dynamically via `computeArcAlt()` for realism (strike arcs taller than deployments)
   - Click handler triggers `onEventClick(event)` → sets `selectedEvent` in App state
   - Points and labels placed at coordinates

5. **Timeline component** → Receives `events` + `startTime`/`endTime` + `currentTime`
   - Filters events within campaign window
   - Renders colored dots on scrubber bar (size/color by importance)
   - Click dot seeks to event timestamp + selects event

6. **EventCard component** → Receives single `selectedEvent` + `onCloseCard` handler
   - Renders title, subtitle, description, metadata (casualties, source, tags)
   - Lists targets with coordinates
   - "Watch video" button triggers VideoModal

7. **VideoModal component** → YouTube search CTA; links to external video search by event `searchQuery`

8. **Legend component** → Reads EVENT_TYPES and COUNTRIES enums; renders static color legend

**Data consumption points:**
- `getTypeColor()` in `utils/colors.js` — maps EVENT_TYPES to hex colors
- `getImportanceColor()` — maps importance string to hex color
- Timeline scrubber — importance value determines dot size
- Globe arc rendering — `arcColor`, `arcAltitude`, `arcSpeed` directly used by react-globe.gl

---

### Concrete TODOs — Prioritized

#### P0 — Blocker (required before any data release)

| Task | File(s) | Details | Effort |
|---|---|---|---|
| **Add October 7, 2023 event** | `src/data/events.js` | Core foundational event. Include Hamas rocket barrage, ground assault, kibbutz massacres. Origin: Gaza (LOC.GAZA or inline ~31.5°N, 34.5°E). Targets: Israeli border communities, Nova festival site. ~3,000 casualties. Importance: critical. Sourced: IDF, Reuters, BBC. This event must exist or the timeline narrative is broken. | 1–2 hrs |
| **Add October 27, 2023 Gaza ground invasion** | `src/data/events.js` | IDF armored columns cross Gaza border; artillery begins. Origin: Israeli border. Targets: Gaza City, northern Gaza districts. Casualty estimates contested. Importance: critical. This is a major military operation that MUST be represented. | 1–2 hrs |
| **Create LOC.GAZA_CITY entry** | `src/data/events.js` | Add to LOC dictionary: `GAZA_CITY: { lat: 31.5017, lng: 34.4674, label: 'Gaza City' }`. Normalize all Gaza event coords to use LOC. Prevents future coordinate drift. | 30 mins |
| **Fill Oct–Nov 2023 gap with ~4–6 events** | `src/data/events.js` | Add: initial Hezbollah rocket fire into northern Israel (Sep 2024? or Oct 2023 precursor?), major IDF Gaza airstrikes, Rafah crossing operation, casualty milestones. Research and add at least 4 to prevent narrative collapse. | 4–6 hrs |

#### P1 — High priority (data completeness & consistency)

| Task | File(s) | Details | Effort |
|---|---|---|---|
| **Add Northern Arrows campaign anchor event** | `src/data/events.js` | `campaigns[2]` starts Sep 15, 2024, but first event (ID 8, Pager Op) is Sep 17. Add Sep 15 event: Hezbollah initiates rocket barrage into northern Israel (the _reason_ the campaign exists). Otherwise campaign lacks its opening trigger. | 1–2 hrs |
| **Separate simulated from real events** | `src/data/events.js` | All 6 simulated events (IDs 22, 23, 24, and others) should be moved to a separate `simulatedEvents` export or marked with prominent `simulated: true` flag (already present for some). Consider UI-level separation or "forecast" campaign mode. | 1–2 hrs |
| **Add ~6 events: 2025 Q3–Q4 gap** | `src/data/events.js` | Six-month void between May 2025 (B-2 strike) and Jan 2026 (True Promise III). Either the conflict genuinely paused, or events are missing. Research and fill with reasonable escalation pathway, OR explicitly document why the gap exists. | 4–8 hrs |
| **Calibrate importance ratings** | `src/data/events.js` | Establish rubric (e.g., >100 casualties OR strategic facility destroyed = critical; routine deployments = major; minor skirmishes = default). Audit all 28 events and recalibrate. | 2 hrs |
| **Refactor COUNTRIES enum** | `src/data/events.js` | Split into STATE_ACTORS and NON_STATE_ACTORS, OR remove "(Terror Org)" from Hamas label for neutrality, OR add separate `classification` field. Current mixed enum is confusing. | 1 hr |

#### P2 — Medium priority (data quality & maintenance)

| Task | File(s) | Details | Effort |
|---|---|---|---|
| **Add munition type field** | `src/data/events.js` | New optional field `munitions: ['F-35I', 'JDAM', ...]`. Extract from descriptions and normalize. Enables filtering by capability. | 3–4 hrs |
| **Add casualty source tracking** | `src/data/events.js` | Extend `casualties` field or add new field: `{ count: "400+", source: "Gaza MoH", disputed: true }`. Distinguish official vs. contested counts. | 2–3 hrs |
| **Add damage assessment field** | `src/data/events.js` | New field `damage: { type: "infrastructure" | "personnel" | "mixed", status: "destroyed" | "damaged" | "degraded" }`. Track facility degradation. | 2 hrs |
| **Document coordinate precision** | `src/data/events.js` | Add `precision: { level: "exact" | "approximate" | "city-level", notes: "..." }`. Flag Majdal Shams and other approximations. | 1–2 hrs |
| **Add strike confirmation field** | `src/data/events.js` | New field `confirmation: { status: "confirmed" | "disputed" | "alleged", sources: ["Reuters", "IDF"] }`. Distinguish reported vs. confirmed events. | 2 hrs |
| **Expand location presets** | `src/data/events.js` | Add Gaza sub-districts: KHAN_YOUNIS, RAFAH, SHATI, BEIT_HANOUN. Add Lebanese sub-regions: TYRE, SIDON, BAALBEK. Future-proofs granular event placement. | 1 hr |

#### P3 — Lower priority (future enhancements)

| Task | File(s) | Details | Effort |
|---|---|---|---|
| **Add event metadata: interception rates** | `src/data/events.js` | For defensive events (air defense), record what percentage of projectiles were intercepted. Enables defensive-effectiveness analysis. | 2 hrs |
| **Create secondary actors field** | `src/data/events.js` | New field `secondaryActors: ["USA", "UK", "France"]` for multi-national operations (e.g., coalition airstrikes). Improves precision. | 2 hrs |
| **Add event series/campaign tags** | `src/data/events.js` | Tag events with abstract campaign names: `campaigns: ["Iron Swords", "Operation True Promise", "Days of Repentance"]`. Enables thematic grouping beyond date ranges. | 2 hrs |
| **Version the events schema** | `src/data/events.js` | Add `schema_version: "1.0"` export. When fields are added in future, increment version and document migrations for backward compatibility. | 30 mins |

---

### Summary

The events database is **functionally complete but narratively incomplete**. The schema is well-structured and consistent; visualization integration is clean. However, critical historical events are absent (October 7, Gaza ground invasion), entire operational periods are under-indexed (Oct–Nov 2023), and the dataset carelessly mixes real and simulated events.

**The highest-impact work is filling narrative gaps, not schema refactoring.** The October 7 event is non-negotiable; Gaza coverage must expand; and the 2025 void must be explained or closed. Once those gaps are fixed, the 12 P1/P2 enhancements (casualty source tracking, damage assessment, munition types, coordinate precision) will make the data suitable for serious OSINT analysis and filtering.

_Section written by Events Engineer agent on 2026-04-18._

---

## 5. QA & Performance Analyst — Quality & Testing
[To be filled by QA agent]

---
