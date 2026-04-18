---
name: OSINT 3D Globe — Project Context
description: Key facts about the OSINT theater map project for QA context
type: project
---

React + Vite + react-globe.gl app visualizing Israel/Iran/US conflict events on a 3D globe. 28 events in src/data/events.js (IDs 1-28, but ID 24 is out-of-order at the bottom). Two modes: live (random arc cycling) and timeline (RAF-driven playback). Three campaigns defined. Deploying to Vercel.

**Why:** Production deploy imminent — quality matters.
**How to apply:** Treat every review as pre-deploy. Flag anything that could cause visible errors or crashes in production.
