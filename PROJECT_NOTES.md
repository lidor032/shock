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
[To be filled by Events agent]

---

## 5. QA & Performance Analyst — Quality & Testing
[To be filled by QA agent]

---
