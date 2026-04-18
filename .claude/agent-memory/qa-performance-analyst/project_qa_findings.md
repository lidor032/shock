---
name: QA findings — OSINT Globe codebase
description: Key bugs, memory leaks, performance patterns, and schema conventions found in the OSINT Globe React app
type: project
---

Key confirmed defects and patterns discovered during QA review (2026-04-18):

**Confirmed bugs:**
- Cursor-stuck-as-pointer in live mode: `onArcHover`/`onPointHover` in Globe3D.jsx (lines 285, 297) set `document.body.style.cursor` directly; when live mode cycles arcs out of `arcsData`, the hover-end event may not fire for removed arcs.
- `key={i}` on EventCard targets (line 75) and NewsFeed ticker items (line 19) — incorrect React reconciliation.
- `useNews` error state discarded at `App.jsx:49` — silent failure when news API is unavailable.
- `res.ok` not checked before `.json()` in `useNews.js:22`.
- `Timeline.jsx:17` division by zero if `endTime === startTime` — `NaN` sliderValue.

**Memory leaks:** All useEffect cleanups are correct. No leaks except the cursor defect above.

**Performance:** The `stableKeyRef` + `activeEventKey` memoization pattern in useSimulation.js + Globe3D.jsx correctly prevents 60fps useMemo re-fires. Header, Legend, NewsFeed, EventCard lack React.memo and re-render at 60fps in timeline mode. Four inline function props on <Globe> recreated every render.

**Schema conventions:** All 28 events validated. Only 'critical' and 'major' importance values used (not 'moderate' or 'minor'). ID 24 is out of physical array order. `arcColor` is always a 2-element string array. `simulated: true` on IDs 22, 23, 24.

**Test infrastructure:** Zero tests. Vitest is the correct choice (Vite-native). Globe3D must be mocked in jsdom tests (Three.js needs real WebGL).

**Why:** Documented for future reviews to avoid re-discovering the same issues.
**How to apply:** Start any new review by checking these known-fragile areas first.
