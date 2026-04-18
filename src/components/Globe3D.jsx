import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import Globe from 'react-globe.gl'
import { getTypeColor, getImportanceColor } from '../utils/colors'

const INIT_LAT = 31.5
const INIT_LNG  = 35.0
const INIT_ALT  = 2.0

// ── Country flag markers (static, always visible) ────────────────────────────
const FLAG_MARKERS = [
  { lat: 31.5,  lng: 35.0,  country: 'IL', flag: '🇮🇱', label: 'Israel',       _type: 'flag' },
  { lat: 32.0,  lng: 53.0,  country: 'IR', flag: '🇮🇷', label: 'Iran',         _type: 'flag' },
  { lat: 33.8,  lng: 35.8,  country: 'LB', flag: '🇱🇧', label: 'Lebanon',      _type: 'flag' },
  { lat: 31.5,  lng: 34.46, country: 'PS', flag: '🇵🇸', label: 'Gaza',         _type: 'flag' },
  { lat: 15.5,  lng: 44.0,  country: 'YE', flag: '🇾🇪', label: 'Yemen',        _type: 'flag' },
  { lat: 33.3,  lng: 44.4,  country: 'IQ', flag: '🇮🇶', label: 'Iraq',         _type: 'flag' },
  { lat: 24.7,  lng: 46.7,  country: 'SA', flag: '🇸🇦', label: 'Saudi Arabia', _type: 'flag' },
  { lat: 38.0,  lng: 32.0,  country: 'TR', flag: '🇹🇷', label: 'Turkey',       _type: 'flag' },
  { lat: 30.0,  lng: 31.2,  country: 'EG', flag: '🇪🇬', label: 'Egypt',        _type: 'flag' },
  { lat: 25.3,  lng: 55.3,  country: 'AE', flag: '🇦🇪', label: 'UAE',          _type: 'flag' },
]

// Types whose arcs hug the surface and move slowly (logistical routes, not strikes)
const DEPLOYMENT_TYPES = new Set(['deployment', 'airlift'])

// ── Dynamic arc altitude ───────────────────────────────────────────────────────
// Compute a realistic atmospheric trajectory height from angular distance.
// Deployment types override this with their own near-surface values.
//
// sqrt-scale keeps short-range strikes low and intercontinentals sub-orbital:
//   ~2°  (Lebanon→Israel)    → 0.04-0.07
//   ~14° (Iran→Israel)       → 0.19
//   ~18° (Yemen→Israel)      → 0.21
//   ~46° (Diego Garcia→Iran) → 0.28 (capped)
function computeArcAlt(origin, target) {
  if (!origin || !target) return 0.08
  const midLat = ((origin.lat + target.lat) / 2) * (Math.PI / 180)
  const dLat   = target.lat - origin.lat
  const dLng   = (target.lng - origin.lng) * Math.cos(midLat)
  const dist   = Math.sqrt(dLat * dLat + dLng * dLng)
  return Math.min(0.28, Math.max(0.04, Math.sqrt(dist) * 0.05))
}

// ── Per-arc style params ───────────────────────────────────────────────────────
// Stored directly in the arc data object so <Globe> can use plain string accessors
// (e.g. arcDashLength="dl"), keeping useMemo deps stable with no inline functions.
function arcStyle(ev, target) {
  const isDeployment = DEPLOYMENT_TYPES.has(ev.type)

  if (isDeployment) {
    const isAirlift = ev.type === 'airlift'
    return {
      // Flat surface route for naval; very low for airlift
      altitude: isAirlift ? (ev.arcAltitude ?? 0.05) : (ev.arcAltitude ?? 0.002),
      // Multiple dashes visible simultaneously = convoy/route feel
      dl:       0.10,
      dg:       0.06,
      // Very slow — 10–18s to traverse the full arc
      animTime: ev.arcSpeed ?? (isAirlift ? 9000 : 16000),
      stroke:   1.8,
    }
  }

  return {
    altitude: computeArcAlt(ev.origin, target),
    dl:       0.03,   // tiny dot racing along the path
    dg:       0.97,
    animTime: ev.arcSpeed ?? 1800,
    stroke:   2.0,
  }
}

// ── Keyboard navigation speed ────────────────────────────────────────────────
const KEY_PAN_SPEED  = 3    // degrees per keypress
const KEY_ZOOM_STEP  = 0.15 // altitude change per keypress
const KEY_MIN_ALT    = 0.4
const KEY_MAX_ALT    = 4.0

export default function Globe3D({ events, activeEvents, selectedEvent, onEventClick }) {
  const globeRef = useRef()
  const containerRef = useRef()
  const keysDown = useRef(new Set())
  const rafKeyRef = useRef(null)
  const [dims, setDims] = useState({ w: window.innerWidth, h: window.innerHeight })
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const handler = () => setDims({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  // ── Initialize globe controls ──────────────────────────────────────────────
  useEffect(() => {
    if (!globeRef.current) return
    const timer = setTimeout(() => {
      // Strategic side-angle view — looking at the Middle East from across a table,
      // not top-down from satellite. altitude 2.0 gives a cinematic war-room perspective.
      globeRef.current.pointOfView({ lat: INIT_LAT, lng: INIT_LNG, altitude: INIT_ALT }, 0)
      const controls = globeRef.current.controls()
      if (controls) {
        controls.enableRotate = true
        controls.enableZoom   = true
        controls.enablePan    = true
        controls.autoRotate   = false
        controls.zoomSpeed    = 1.0
        controls.rotateSpeed  = 0.8
        // Constrain vertical orbit to a horizontal band — prevents user from flipping
        // to a top-down or bottom-up view; keeps the war-room table angle locked.
        controls.minPolarAngle = Math.PI * 0.35
        controls.maxPolarAngle = Math.PI * 0.65
      }
      setReady(true)
    }, 400)
    return () => clearTimeout(timer)
  }, [])

  // ── Keyboard navigation (WASD / Arrows / +- zoom) ─────────────────────────
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const onKeyDown = (e) => {
      const key = e.key.toLowerCase()
      if (['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','+','=','-','_'].includes(key)) {
        e.preventDefault()
        keysDown.current.add(key)
        if (!rafKeyRef.current) tickKeys()
      }
    }

    const onKeyUp = (e) => {
      keysDown.current.delete(e.key.toLowerCase())
      if (keysDown.current.size === 0 && rafKeyRef.current) {
        cancelAnimationFrame(rafKeyRef.current)
        rafKeyRef.current = null
      }
    }

    function tickKeys() {
      if (!globeRef.current || keysDown.current.size === 0) {
        rafKeyRef.current = null
        return
      }
      const pov = globeRef.current.pointOfView()
      let { lat, lng, altitude } = pov
      const keys = keysDown.current

      if (keys.has('w') || keys.has('arrowup'))    lat = Math.min(90,  lat + KEY_PAN_SPEED)
      if (keys.has('s') || keys.has('arrowdown'))  lat = Math.max(-90, lat - KEY_PAN_SPEED)
      if (keys.has('a') || keys.has('arrowleft'))  lng -= KEY_PAN_SPEED
      if (keys.has('d') || keys.has('arrowright')) lng += KEY_PAN_SPEED
      if (keys.has('+') || keys.has('='))          altitude = Math.max(KEY_MIN_ALT, altitude - KEY_ZOOM_STEP)
      if (keys.has('-') || keys.has('_'))          altitude = Math.min(KEY_MAX_ALT,  altitude + KEY_ZOOM_STEP)

      globeRef.current.pointOfView({ lat, lng, altitude }, 120)
      rafKeyRef.current = requestAnimationFrame(tickKeys)
    }

    el.addEventListener('keydown', onKeyDown)
    el.addEventListener('keyup', onKeyUp)
    return () => {
      el.removeEventListener('keydown', onKeyDown)
      el.removeEventListener('keyup', onKeyUp)
      if (rafKeyRef.current) cancelAnimationFrame(rafKeyRef.current)
    }
  }, [])

  // ── Stable memoization key ─────────────────────────────────────────────────
  // activeEvents gets a new array reference every RAF tick in timeline mode, but
  // the actual set of visible event IDs changes far less frequently.
  // Keying on the sorted ID string prevents Globe's three useMemo calls from
  // re-running on every single animation frame.
  const activeEventKey = activeEvents.map((e) => e.id).sort().join(',')
  const selectedId     = selectedEvent?.id ?? null

  // ── Arc data — combat strikes & deployments unified with per-arc style ─────
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const arcsData = useMemo(() =>
    activeEvents.flatMap((ev) =>
      (ev.targets ?? []).map((target) => {
        const style = arcStyle(ev, target)
        return {
          startLat: ev.origin.lat,
          startLng: ev.origin.lng,
          endLat:   target.lat,
          endLng:   target.lng,
          color:    ev.arcColor ?? [getTypeColor(ev.type), getTypeColor(ev.type)],
          altitude: style.altitude,
          dl:       style.dl,
          dg:       style.dg,
          animTime: style.animTime,
          stroke:   style.stroke,
          event:    ev,
        }
      })
    ),
  [activeEventKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Point markers ─────────────────────────────────────────────────────────
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
          color:    DEPLOYMENT_TYPES.has(ev.type) ? getTypeColor(ev.type) : '#ff2222',
          altitude: 0.005,
          event:    ev,
        }))
      }

      return pts
    })
  }, [activeEventKey, selectedId, events]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── HTML labels + flag markers ────────────────────────────────────────────
  // Combines event labels (dynamic, keyed to activeEvents) and static country
  // flag markers into one array. react-globe.gl only supports a single
  // htmlElementsData prop, so both types share the same layer.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const htmlData = useMemo(() => [
    ...activeEvents.map((ev) => ({
      lat:   ev.origin.lat,
      lng:   ev.origin.lng,
      text:  ev.origin.label,
      color: getTypeColor(ev.type),
      _type: 'label',
    })),
    ...FLAG_MARKERS,
  ], [activeEventKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Interaction handlers (stable refs) ────────────────────────────────────
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
    if (d._type === 'flag') {
      const el = document.createElement('div')
      el.className = 'flag-marker'
      el.innerHTML = `<span class="flag-emoji">${d.flag}</span><span class="flag-label">${d.label}</span>`
      el.style.pointerEvents = 'none'
      return el
    }
    // Default: event label
    const el = document.createElement('div')
    el.className     = 'event-label'
    el.textContent   = d.text
    el.style.color       = d.color
    el.style.borderColor = `${d.color}88`
    el.style.textShadow  = `0 0 6px ${d.color}`
    return el
  }, [])

  // Clean up cursor on unmount
  useEffect(() => () => { document.body.style.cursor = 'auto' }, [])

  return (
    <div
      ref={containerRef}
      className="w-full h-full outline-none"
      tabIndex={0}
      onMouseDown={() => containerRef.current?.focus()}
    >
      <Globe
        ref={globeRef}
        width={dims.w}
        height={dims.h}

        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        atmosphereColor="#00cc44"
        atmosphereAltitude={0.18}

        // ── Arcs — per-arc style via string accessors (no inline functions) ──
        arcsData={arcsData}
        arcStartLat="startLat"
        arcStartLng="startLng"
        arcEndLat="endLat"
        arcEndLng="endLng"
        arcColor="color"
        arcAltitudeAutoScale={false}
        arcAltitude="altitude"
        arcStroke="stroke"
        arcDashLength="dl"
        arcDashGap="dg"
        arcDashAnimateTime="animTime"
        arcLabel={(d) => d.event?.title}
        onArcClick={handleArcClick}
        onArcHover={(arc) => { document.body.style.cursor = arc ? 'pointer' : 'auto' }}

        // ── Points ────────────────────────────────────────────────────────────
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

        // ── HTML labels ───────────────────────────────────────────────────────
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
