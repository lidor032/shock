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
[To be filled by WebGL agent]

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
