import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import Globe from 'react-globe.gl'
import { getTypeColor, getImportanceColor } from '../utils/colors'

const INIT_LAT = 31
const INIT_LNG  = 44
const INIT_ALT  = 1.3

// ── Dynamic arc altitude ──────────────────────────────────────────────────────
// Instead of per-event static altitudes, compute a realistic trajectory height
// based on the angular distance between origin and target.
//
// Uses sqrt scaling so:
//   - Very short flights  (~1-2°)  → 0.04-0.07  (barely above surface)
//   - Regional strikes   (~5-15°) → 0.10-0.19  (atmospheric)
//   - Intercontinental  (~40-50°) → capped 0.28 (high atmosphere, never orbital)
//
// The cos(lat) correction removes longitude distortion at high latitudes.
function computeArcAlt(origin, target) {
  if (!origin || !target) return 0.08
  const midLat = ((origin.lat + target.lat) / 2) * (Math.PI / 180)
  const dLat   = target.lat - origin.lat
  const dLng   = (target.lng - origin.lng) * Math.cos(midLat)
  const dist   = Math.sqrt(dLat * dLat + dLng * dLng)
  return Math.min(0.28, Math.max(0.04, Math.sqrt(dist) * 0.05))
}

export default function Globe3D({ events, activeEvents, selectedEvent, onEventClick }) {
  const globeRef = useRef()
  const [dims, setDims] = useState({ w: window.innerWidth, h: window.innerHeight })
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const handler = () => setDims({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  useEffect(() => {
    if (!globeRef.current) return
    const timer = setTimeout(() => {
      globeRef.current.pointOfView({ lat: INIT_LAT, lng: INIT_LNG, altitude: INIT_ALT }, 1500)
      setReady(true)
    }, 400)
    return () => clearTimeout(timer)
  }, [])

  // ── Stable key derived from active event IDs ───────────────────────────────
  // activeEvents gets a new array reference every RAF frame in timeline mode,
  // but the actual set of visible events changes infrequently (every 12 game-hours).
  // useMemo on this key avoids re-running expensive flatMaps on every frame.
  const activeEventKey = activeEvents.map((e) => e.id).sort().join(',')

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const arcsData = useMemo(() =>
    activeEvents.flatMap((ev) =>
      (ev.targets ?? []).map((target) => ({
        startLat: ev.origin.lat,
        startLng: ev.origin.lng,
        endLat:   target.lat,
        endLng:   target.lng,
        color:    ev.arcColor ?? [getTypeColor(ev.type), getTypeColor(ev.type)],
        altitude: computeArcAlt(ev.origin, target),  // dynamic — never orbital
        animTime: ev.arcSpeed ?? 1800,
        event:    ev,
      }))
    ),
  [activeEventKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const selectedId = selectedEvent?.id ?? null

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const pointsData = useMemo(() => {
    const activeIds = new Set(activeEvents.map((e) => e.id))
    return events.flatMap((ev) => {
      const isActive   = activeIds.has(ev.id)
      const isSelected = selectedId === ev.id
      const color      = getImportanceColor(ev.importance)

      const pts = [{
        lat:      ev.origin.lat,
        lng:      ev.origin.lng,
        label:    ev.origin.label,
        size:     isSelected ? 0.6 : isActive ? 0.45 : 0.25,
        color:    isActive ? color : `${color}55`,
        altitude: 0.005,
        event:    ev,
      }]

      if (isActive) {
        ev.targets?.forEach((t) => pts.push({
          lat:      t.lat,
          lng:      t.lng,
          label:    t.label,
          size:     0.4,
          color:    '#ff2222',
          altitude: 0.005,
          event:    ev,
        }))
      }

      return pts
    })
  }, [activeEventKey, selectedId, events]) // eslint-disable-line react-hooks/exhaustive-deps

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const htmlData = useMemo(() =>
    activeEvents.map((ev) => ({
      lat:   ev.origin.lat,
      lng:   ev.origin.lng,
      text:  ev.origin.label,
      color: getTypeColor(ev.type),
    })),
  [activeEventKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Interaction handlers ───────────────────────────────────────────────────
  const handlePointClick = useCallback((pt) => {
    if (!pt?.event) return
    onEventClick(pt.event)
    if (globeRef.current) {
      globeRef.current.pointOfView({ lat: pt.lat, lng: pt.lng, altitude: 1.0 }, 800)
    }
  }, [onEventClick])

  const handleArcClick = useCallback((arc) => {
    if (arc?.event) onEventClick(arc.event)
  }, [onEventClick])

  const htmlElement = useCallback((d) => {
    const el = document.createElement('div')
    el.className = 'event-label'
    el.textContent = d.text
    el.style.color       = d.color
    el.style.borderColor = `${d.color}88`
    el.style.textShadow  = `0 0 6px ${d.color}`
    return el
  }, [])

  return (
    <div className="w-full h-full">
      <Globe
        ref={globeRef}
        width={dims.w}
        height={dims.h}

        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        atmosphereColor="#00cc44"
        atmosphereAltitude={0.18}

        arcsData={arcsData}
        arcStartLat="startLat"
        arcStartLng="startLng"
        arcEndLat="endLat"
        arcEndLng="endLng"
        arcColor="color"
        arcAltitudeAutoScale={false}
        arcAltitude="altitude"
        arcStroke={0.5}
        arcDashLength={0.35}
        arcDashGap={0.15}
        arcDashAnimateTime="animTime"
        arcLabel={(d) => d.event?.title}
        onArcClick={handleArcClick}
        onArcHover={(arc) => { document.body.style.cursor = arc ? 'pointer' : 'auto' }}

        pointsData={pointsData}
        pointLat="lat"
        pointLng="lng"
        pointColor="color"
        pointAltitude="altitude"
        pointRadius="size"
        pointsMerge={false}
        pointLabel={(d) => d.label}
        onPointClick={handlePointClick}
        onPointHover={(pt) => { document.body.style.cursor = pt ? 'pointer' : 'auto' }}

        htmlElementsData={htmlData}
        htmlLat="lat"
        htmlLng="lng"
        htmlAltitude={0.015}
        htmlElement={htmlElement}

        enablePointerInteraction={true}
        animateIn={false}
      />

      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <div className="text-center">
            <div className="text-green-400 glow text-lg font-bold tracking-widest animate-pulse">
              INITIALIZING THEATER MAP...
            </div>
            <div className="text-green-700 text-xs mt-2">LOADING SATELLITE IMAGERY</div>
          </div>
        </div>
      )}
    </div>
  )
}
