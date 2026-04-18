---
name: Events Database Schema & Architecture
description: Complete analysis of events.js structure, data flow, and quality observations
type: reference
---

## Current Schema & Structure

**Location:** `/Users/lidor/Desktop/stam/src/data/events.js`

### Event Object Fields
- `id` (number): Sequential identifier (1–28)
- `date` (string): ISO date "YYYY-MM-DD"
- `timestamp` (number): Unix milliseconds via ts() helper
- `title` (string): Short event title (~60 chars max)
- `subtitle` (string): Contextual one-liner (~100 chars)
- `description` (string): 2–4 sentence factual detail
- `type` (string): One of EVENT_TYPES enum
- `importance` (string): "critical", "major", or other
- `origin` (object): {lat, lng, label} — launch/start point
- `targets` (array): [{lat, lng, label}, ...] — impact locations
- `country` (string): Primary actor from COUNTRIES enum
- `casualties` (string): Free-text casualty counts
- `source` (string): Attribution & sourcing
- `searchQuery` (string): Historical reference for verification
- `tags` (array): String tags for filtering
- `arcAltitude` (number): Visual arc height override [0–1]
- `arcSpeed` (number): Arc animation speed in ms
- `arcColor` (array): [startColor, endColor] hex strings
- `simulated` (boolean): Flag for hypothetical 2025–2026 events

### Enums

**EVENT_TYPES**
- `missile` — ballistic/cruise missile strikes
- `airstrike` — air-delivered weapons (F-35s, bombers)
- `drone` — loitering/armed drones
- `naval` — maritime operations
- `defense` — air defense, interception, ceasefire
- `ground` — ground incursion, armor movement
- `deployment` — force movement/positioning
- `airlift` — strategic air transport (C-17, tankers)

**COUNTRIES**
- Iran, Israel, USA
- Hezbollah, Houthi, Iraq PMF, Hamas (Terror Org)

**IMPORTANCE**
- "critical" — historic, strategic turning point, mass casualties
- "major" — significant operation
- Other values (unnamed) — routine/minor operations

### Location Preset (LOC)
26 predefined geographic coordinates with labels:
- **Iranian:** Tehran, Isfahan, Tabriz, Bandar Abbas, Kharg Island
- **Israeli:** Jerusalem, Tel Aviv, Haifa, Nevatim, Dimona, Ramat David
- **Lebanese:** Beirut, South Lebanon
- **Other:** Damascus, Sanaa, Hodeidah, Baghdad, Tower 22, Al-Tanf
- **Carrier Positions:** USS Ford, USS Ike, USS Lincoln
- **Sea Routes:** Red Sea, Gulf of Aden, Persian Gulf
- **Strategic Bases:** Diego Garcia

### Campaigns
3 defined timeline windows:
1. `all` — Global Timeline (Iron Swords), 2023-10-07 to 2026-04-17
2. `days-of-repentance` — Oct 20–30, 2024 (narrow ops window)
3. `northern-arrows` — Sept 15 – Nov 30, 2024 (Hezbollah campaign)

---

## Event Coverage (28 Total Events)

### By Type
- Missile attacks: 6 events (Iran True Promise I/II/III, Houthi, Yemen)
- Airstrikes: 8 events (Israel F-35, US B-1B/B-2, Gaza operations)
- Drone strikes: 3 events (Iran-backed Iraq, Israel Isfahan/pager operations)
- Naval/deployment: 4 events (USS carriers positioning)
- Ground operations: 2 events (Lebanon invasion, airlifts)
- Defense/ceasefire: 2 events (air defense, ceasefires)
- Intelligence ops: 1 event (Hezbollah pager detonation)

### By Geography
- **Iran-Israel theater:** 11 events (crosses, retaliation cycles)
- **Lebanon-Israel front:** 5 events (Hezbollah escalation, ceasefire)
- **Red Sea/Houthi:** 4 events (shipping strikes, US response)
- **Gaza:** 2 events (ceasefire, resumption)
- **US deployments:** 5 events (carrier strike groups, THAAD, airlift)
- **Iraq/Syria:** 2 events (Tower 22, US retaliation)

### By Date Range
- **Oct 2023–Dec 2023:** 5 events (early response, carrier deployments)
- **Jan 2024–Apr 2024:** 7 events (escalation cycle, True Promise I, Isfahan)
- **May 2024–Sept 2024:** 4 events (Majdal Shams, pager op, Nasrallah)
- **Oct 2024:** 5 events (True Promise II, Days of Repentance, Lebanon)
- **Nov 2024:** 1 event (Lebanon ceasefire)
- **2025:** 5 events (Gaza ceasefire & collapse, US–Iran talks, B-2 strikes, Natanz)
- **2026:** 3 events (True Promise III, US–Israel joint strike, USS Carl Vinson)

---

## Data Quality Observations

### Strengths
1. **Consistent schema:** All events follow the same structure; no missing required fields
2. **Verified coordinates:** Military bases use real coordinates (Nevatim: 31.2077, 35.0127)
3. **Arc styling:** Visual parameters (altitude, speed, color) consistent within type
4. **Source attribution:** Every event cites Reuters, AP, IDF, IRNA, etc.
5. **Temporal accuracy:** Dates align with known events (April 13 True Promise, Sept 17 pagers)
6. **Tagging:** Events tagged for filtering (e.g., "historic", "F-35", "nuclear")

### Weaknesses & Gaps

1. **Incomplete Gaza coverage (2023–2024):**
   - October 7 attack not represented
   - Ground operations (Shati, Gaza City) missing
   - Specific strikes (Al-Shifa hospital, Jenin) absent
   - Only 2 Gaza events in dataset (ceasefire phases 2025+)

2. **Ambiguous importance ratings:**
   - "critical" used for both Oct 7 response AND routine carrier deployments
   - No clear threshold; lacks quantitative criteria (casualty count? strategic impact?)
   - "major" vs. "critical" distinction unclear

3. **Coordinate precision issues:**
   - Some targets approximate (South Lebanon: 33.27, 35.20 — no specific suburb)
   - Majdal Shams origin overly vague (SOUTHERN_LEB placeholder)
   - Natanz location only added in 2025 event; real-world facility known

4. **Actor naming inconsistency:**
   - "Hamas (Terror Org)" — editorial label violates neutrality
   - Inconsistent use: COUNTRIES.HEZBOLLAH vs. generic "Hezbollah"
   - COUNTRIES enum mixes state (Iran, Israel) with non-state actors (Hamas, Houthi)

5. **Missing metadata fields:**
   - No munition types recorded (JDAM, GBU-57, Shahed-136, etc.)
   - No confirmed vs. disputed casualty distinction
   - No damage assessment (facility destroyed, damaged, cratered, etc.)
   - No interception rates for defensive events

6. **Simulated events (2025–2026) labeled but not clearly separated:**
   - 6 events marked `simulated: true` or source "SIMULATED"
   - Mixed timeline makes it ambiguous which are actual vs. speculative
   - Natanz strike (2025-08-20) lacks clear "simulated" flag despite being speculative

7. **Red Sea campaign under-indexed:**
   - Only 4 Houthi events; ongoing shipping war ongoing beyond dataset
   - No granular attack pattern (weekly missile cycles not captured)
   - Unclear which shipping targets are incidental vs. strategic

8. **Incomplete northern front documentation:**
   - Only 5 Lebanon-Israel events before ceasefire
   - Rocket barrages (daily Hezbollah fire) aggregated into major events only
   - Southern Lebanon cross-border positions not precisely modeled

---

## Data Flow & Visualization Pipeline

### Events → Components

**App.jsx** imports `{events, campaigns}` and passes to:

1. **Globe3D.jsx**
   - Receives: full `events` array + `activeEvents` (filtered by time)
   - Renders: arcs (origin → targets) with animations
   - Uses: `arcAltitude`, `arcSpeed`, `arcColor`, type/importance colors
   - Interaction: Click event triggers `onEventClick(event)`

2. **Timeline.jsx**
   - Receives: events + `currentTime`, `startTime`, `endTime`
   - Filters: Only events within campaign window shown
   - Renders: Dots on timeline bar, sized by importance
   - Interaction: Click dot seeks to event timestamp

3. **EventCard.jsx**
   - Receives: `selectedEvent` (single event object)
   - Renders: Title, subtitle, description, metadata
   - Uses: Casualty, source, tags for detail view

4. **Legend.jsx**
   - Reads: EVENT_TYPES and COUNTRIES enums
   - Renders: Color legend for event types and countries

### useSimulation Hook
- Tracks `currentTime` and plays timeline forward
- Filters `events` to generate `activeEvents` array
- Shows only events with `timestamp <= currentTime`

### useNews Hook
- Independent of events.js
- Fetches news headlines from external source

---

## Concrete TODOs for Events Engineer

### High Priority
1. **Add October 7, 2023 event**
   - Massive foundational event missing from timeline
   - ~2,000 Israeli casualties, establishes conflict start
   - Will require Gaza locations (Gaza City: ~31.52°N, 34.47°E)

2. **Expand Gaza coverage (Nov 2023–Mar 2025)**
   - Ground operations by IDF (Shati, Khan Younis, Rafah)
   - Hospital strikes (Al-Shifa: 31.5197, 34.4431)
   - Major civilian impact events

3. **Refine importance calibration**
   - Establish explicit rubric (e.g., >100 casualties = critical)
   - Audit all 28 events for consistency
   - Separate "historic" from "strategic escalation"

4. **Separate simulated from real events**
   - Add `isSimulated: boolean` to all events
   - Create separate campaign for "forecast" timeline
   - Clearly label 2025+ events as speculative in UI

### Medium Priority
5. **Add coordinate precision metadata**
   - `precision: "exact" | "approximate" | "city-level"`
   - Document assumed accuracy (e.g., ±5km for Hezbollah launch sites)
   - Flag Majdal Shams origin as approximate

6. **Expand munition & capability tracking**
   - Add `munitions: ['F-35I', 'Shahed-136', ...]` field
   - Track missile types (Fattah-1, Emad, Arrow-3)
   - Enable filtering by capability

7. **Refactor COUNTRIES enum**
   - Separate STATE and NON_STATE enums
   - Rename "Hamas (Terror Org)" to neutral label
   - Add secondary actors for multi-national events (e.g., "USA + UK")

8. **Aggregate Hezbollah rocket barrages**
   - Track weekly salvo statistics instead of single large events
   - Add `aggregate: true, eventCount: 47` for routine daily fire

### Lower Priority
9. **Add damage assessment field**
   - `damage: "infrastructure" | "personnel" | "minor" | null`
   - Record facility status post-strike

10. **Create Gaza location presets**
    - Define major districts (Gaza City, Khan Younis, Rafah, Shati, Beit Hanoun)
    - Store in LOC object with consistent naming

11. **Document casualty confidence levels**
    - Flag disputed counts (e.g., Gaza MoH vs. Israeli counts)
    - Add `casualtySource: "IDF" | "Gaza MoH" | "disputed"`

12. **Archive and compress historical events**
    - Move Oct 7 + daily operations to a separate `historicalEvents.js`
    - Keep main `events.js` focused on major escalation moments
