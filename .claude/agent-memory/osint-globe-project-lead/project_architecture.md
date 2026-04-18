---
name: OSINT Globe Project Architecture
description: Core architecture, component hierarchy, data pipeline, and state management for the 3D OSINT globe app — verified 2026-04-18
type: project
---

Project is a React + Vite + react-globe.gl + Tailwind CSS OSINT visualization app.
Working directory: /Users/lidor/Desktop/stam
Package name: war-theater-map, version 1.0.0

**Why:** Initializing institutional memory from first full codebase audit on 2026-04-18.

**How to apply:** Use this as the source of truth for component relationships, state shape, and data pipeline when planning tasks.

## Dependencies (package.json)
- react ^18.3.1, react-dom ^18.3.1
- react-globe.gl ^2.27.2
- three ^0.167.1
- date-fns ^3.6.0
- Dev: vite ^5.4.1, @vitejs/plugin-react ^4.3.1, tailwindcss ^3.4.9

## Component Hierarchy
- App.jsx — root, holds ALL state
  - Globe3D.jsx — absolute inset-0 z-0; accepts (events, activeEvents, selectedEvent, onEventClick)
  - Header.jsx — top bar with mode toggle, live clock, static status chips
  - NewsFeed.jsx — scrolling ticker below header, fed by useNews hook
  - Timeline.jsx — bottom panel, only visible in timeline mode; accepts full event list + time controls
  - EventCard.jsx — right panel (absolute right-4 top-28), shown when selectedEvent != null
  - VideoModal.jsx — fullscreen overlay, shown when showVideo == true
  - Legend.jsx — bottom-right, collapsible

## State (all in App.jsx)
- mode: 'live' | 'timeline'
- selectedEvent: event object | null
- showVideo: boolean
- isPlaying: boolean
- speed: 1 | 5 | 20 | 100
- activeCampaignId: 'all' | 'days-of-repentance' | 'northern-arrows'
- currentCampaign: derived via useMemo from activeCampaignId
- currentTime: timestamp (ms), initialized to currentCampaign.start

## Data Files
- src/data/events.js — 28 events total (IDs 1–28; ID 24 appears at end of array, out of numerical order)
  - 3 events are SIMULATED (IDs 22, 23, 24) — flagged with simulated: true
  - Timeline spans 2023-10-07 to 2026-04-17
  - 3 campaigns: 'all', 'days-of-repentance', 'northern-arrows'
- src/data/newsHeadlines.js — 20 static fallback headlines
- src/utils/colors.js — TYPE_COLORS, COUNTRY_COLORS, IMPORTANCE_COLORS maps + 4 getter functions

## Event Schema (canonical, all fields)
Required fields:
  id: number (unique)
  date: 'YYYY-MM-DD' string
  timestamp: ts('YYYY-MM-DDTHH:MM:SSZ') — milliseconds via Date.getTime()
  title: string
  subtitle: string
  description: string (paragraph, sourced)
  type: EVENT_TYPES enum (missile|airstrike|drone|naval|defense|ground|deployment|airlift)
  importance: 'critical' | 'major' | 'moderate' | 'minor'
  origin: { lat, lng, label } — single location object
  targets: [{ lat, lng, label }, ...] — array of 1+ target objects
  country: COUNTRIES enum (Iran|Israel|USA|Hezbollah|Houthi|Iraq PMF)
  casualties: string (human-readable)
  source: string (publication list)
  searchQuery: string (used by VideoModal YouTube embed)
  tags: string[] (keyword array)

Arc visualization fields (per-event, used in Globe3D.jsx):
  arcAltitude: number (0.002–0.7; overrides computeArcAlt for deployment types)
  arcSpeed: number (animateTime in ms; lower = faster)
  arcColor: [startHex, endHex] — gradient pair

Optional flags:
  simulated: true (only present when event is not real OSINT)

## Hooks
- useSimulation — RAF loop for timeline playback (1 real second = 1 game day at 1x speed)
  - Live mode: cycles random 3 events every 3500ms
  - Timeline mode: shows events within a 12-game-hour sliding window of currentTime
  - Returns stable array reference (only changes when visible event set actually changes)
- useNews — fetches NewsAPI if VITE_NEWS_API_KEY set; falls back to static headlines
  - Returns { headlines, loading, error } but App.jsx only consumes headlines

## Globe3D Architecture
- computeArcAlt(origin, target): sqrt-scale formula for ballistic trajectory height
  - deployment/airlift types bypass this and use per-event arcAltitude directly
- arcStyle(ev, target): returns {altitude, dl, dg, animTime, stroke} per arc
  - deployments: dl=0.10, dg=0.06 (convoy feel); strikes: dl=0.03, dg=0.97 (racing dot)
- Three useMemo blocks: arcsData, pointsData, htmlData — keyed on activeEventKey (sorted ID string)
  - This prevents Globe re-renders on every RAF tick
- pointsData: shows ALL events as dim dots; active events bright + target markers added
- htmlData: origin labels only for active events
- Globe textures: loaded from unpkg CDN (external runtime dependency)

## Phase Roadmap Status (as of 2026-04-18)
Phase 1: OSINT Data Generation — Oct 7, 2023 events
  - Gap: No events between Oct 7–31, 2023 in current data (earliest event is ID 25: Oct 8 carrier deployment)
  - There is no Hamas ground assault, rocket barrage, IDF mobilization data, or Gaza ground invasion (Oct 27) data
  - Missing ~8-12 key events from Oct/Nov 2023 period
  - The LOC dictionary has all needed coordinates (Gaza Strip must be added inline)
Phase 2: Physics & Performance Optimization
  - arcAltitude: computeArcAlt() is ALREADY implemented and working for strike types
  - Deployment/airlift types correctly bypass it and use per-event values
  - useMemo: ALREADY implemented correctly with stable activeEventKey
  - Remaining gap: no camera tilt (pointOfView uses lat/lng/altitude, no tilt param)
  - pointsMerge={false} is correct; no virtualization needed at 28 events
Phase 3: UI/UX
  - No fullscreen API implementation
  - No country flag display
  - No camera tilt (react-globe.gl v2 does not expose tilt natively; requires three.js camera access)

## Known Issues (verified)
- LiveClock in Header.jsx uses useState() as a side-effect setter (should be useEffect)
- Header status chips (IRAN THREAT, ACTIVE OPS, US CARRIERS) are hardcoded strings
- YouTube embed uses listType=search which Google has deprecated; autoplay may be blocked
- No vercel.json; no .env files present
- No error boundaries anywhere
- useNews loading/error state not consumed in App.jsx
- Globe textures loaded from unpkg CDN (external dependency risk)
- Event ID 24 (USS Carl Vinson, 2026-04-10) appears out of numerical order after ID 28
- TIMELINE_END is 2026-04-17 (yesterday relative to 2026-04-18)
- Missing Gaza Strip coordinate in LOC dictionary (events use inline coords)
- colors.js TYPE_COLORS uses emoji (potential render issues in some environments)
