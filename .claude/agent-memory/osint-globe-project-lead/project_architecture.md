---
name: OSINT Globe Project Architecture
description: Core architecture, component hierarchy, data pipeline, and state management for the 3D OSINT globe app
type: project
---

Project is a React + Vite + react-globe.gl + Tailwind CSS OSINT visualization app.
Working directory: /Users/lidor/Desktop/stam

**Why:** Initializing institutional memory from first full codebase audit on 2026-04-18.

**How to apply:** Use this as the source of truth for component relationships, state shape, and data pipeline when planning tasks.

## Component Hierarchy
- App.jsx — root, holds all state
  - Globe3D.jsx — full-screen, z-index 0 (never re-renders unless activeEventKey or selectedId changes)
  - Header.jsx — top bar with mode toggle, live clock, static status chips
  - NewsFeed.jsx — scrolling ticker below header, fed by useNews hook
  - Timeline.jsx — bottom panel, only visible in timeline mode
  - EventCard.jsx — right panel, shown when selectedEvent != null
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

## Data
- src/data/events.js — 28 events (IDs 1-28 but ID 24 appears out of order after 28; no ID gap but ordering is non-sequential)
- 3 campaign windows defined in same file
- src/data/newsHeadlines.js — 20 static fallback headlines
- src/utils/colors.js — type/country/importance color maps

## Hooks
- useSimulation — RAF loop for timeline playback; live mode cycles random events every 3.5s
- useNews — fetches NewsAPI if VITE_NEWS_API_KEY set; falls back to static headlines

## Known Issues (from audit)
- LiveClock in Header.jsx uses useState() as a side-effect setter (should be useEffect)
- Header status chips (IRAN THREAT, ACTIVE OPS, US CARRIERS) are hardcoded strings
- YouTube embed uses listType=search which Google has deprecated; autoplay may be blocked by browser
- No vercel.json exists; no .env files present
- No error boundaries anywhere
- No loading/error state exposed from useNews (loading and error returned but not consumed in App.jsx)
- Globe texture and background images loaded from unpkg CDN (external dependency risk at runtime)
- Event ID 24 (USS Carl Vinson) appears out of numerical order in events.js array (after ID 28)
- TIMELINE_END is set to 2026-04-17, meaning the global timeline ends yesterday relative to today (2026-04-18)
