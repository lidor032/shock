---
name: Iron Swords Globe — Project Overview
description: Architecture and key design decisions for the Iron Swords 3D Globe dashboard
type: project
---

Iron Swords is a React 18 + react-globe.gl + Three.js real-time conflict theater visualization app.

Stack: Vite, Tailwind CSS, react-globe.gl, Three.js, date-fns.

Key architectural decisions:
- Globe renders in `Globe3D.jsx` — arcs, points, and HTML labels are three separate data arrays passed as props.
- Simulation state lives in `useSimulation.js` hook — RAF loop drives timeline playback; live mode uses setInterval.
- `activeEventKey` (sorted ID join string) is the intentional memoization key in Globe3D, not the array reference, to prevent RAF-tick churn.
- `arcStyle()` and `computeArcAlt()` are module-scope pure functions (not inline JSX) — stable references by design.
- Per-arc style fields (`dl`, `dg`, `animTime`, `stroke`, `altitude`) are baked into arc data objects so Globe can use string accessors with no inline functions.
- events dataset has ~28 events (ids 1–28), covering Oct 2023 – Apr 2026 including simulated future events.

**Why:** These decisions reduce Globe3D useMemo re-fires from every RAF tick to only when the visible event set changes.
**How to apply:** Any new feature that touches activeEvents shape or adds new arc/point props should follow the same key-based memoization pattern.
