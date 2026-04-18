---
name: OSINT Globe — Project Context
description: Core project facts, stack, data shape, and known fragile areas for the Iron Swords 3D OSINT Globe (updated April 2026 full review)
type: project
---

React + Vite globe app visualizing Israel/Iran/US conflict events on a 3D globe (react-globe.gl / three.js). Two modes: live (random cycling subset) and timeline (scrubable playback).

**Stack:** React 18, Vite 5, react-globe.gl 2.27.2, three 0.167.1, date-fns 3, Tailwind 3.

**Data:** 28 events in src/data/events.js. IDs are NOT contiguous — id 24 appears after id 28 in source order (chronological sort, not ID sort). Events span 2023-10-07 to 2026-04-10. 3 future/simulated events (ids 22, 23, 24) have `simulated: true`.

**Known fragile areas (from April 18, 2026 review):**

1. `LiveClock` in Header.jsx uses `useState` (not `useEffect`) for its setInterval — the cleanup return value is ignored, interval never cleared. Memory leak on every mount.
2. `currentTime` initialized from `currentCampaign.start` at App mount. If campaigns array is ever empty, `campaigns[0]` is undefined and `.start` crashes.
3. `Timeline.jsx` divides by `totalDuration = endTime - startTime`. If a campaign has start === end (or missing), division by zero gives NaN progress and NaN sliderValue.
4. `useSimulation` RAF loop: `lastRealTsRef` is NOT reset when `speed` changes, causing a single oversized game-time jump on the first tick after a speed change.
5. CDN textures loaded from `//unpkg.com` — protocol-relative URL; globe goes blank if unpkg is down at page load. No local fallback.
6. YouTube embed uses deprecated `listType=search` — no fallback UI when iframe fails or is blocked.
7. `useNews` fetch loop: no AbortController — if component unmounts mid-fetch, `setHeadlines` fires on unmounted component (React 18 suppresses the warning but it is still a logical error).
8. `activeEventKey` computed outside any useMemo in Globe3D (line 84) — recomputed every render.
9. `NewsFeed` ticker animation starts at `translateX(100vw)` hardcoded — breaks on viewport resize mid-animation (jumps).
10. `VideoModal` uses `useEffect` inside a function that conditionally returns early (`if (!event) return null` before the `useEffect`). This violates the Rules of Hooks in a subtle way — hooks must not be called after a conditional return.
11. Event id=16 origin is Washington D.C. — arc visually crosses the Atlantic, which is intentional but worth noting.
12. TIMELINE_END is `2026-04-17T00:00:00Z` but event id=24 timestamp is `2026-04-10T00:00:00Z`. Within bounds. No events exceed TIMELINE_END.
13. `importance` values used: only 'critical' and 'major' across all 28 events — 'moderate' and 'minor' are defined in colors.js but never used in data. Low risk.

**Deploy target:** Vercel. No vercel.json present; default Vite build config works. No env variable validation at build time for VITE_NEWS_API_KEY.

**Why:** Full pre-deploy QA review conducted April 18, 2026.
**How to apply:** Items 1 and 10 are the highest-priority bugs to fix before deploy. Items 4, 5, 6, 7 are significant warnings.
