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

// Naval arcs use a forced navy-blue gradient regardless of per-event arcColor
const NAVAL_ARC_COLOR = ['#1E3A5F', '#4A90D9']

// ── Haversine great-circle distance (km) ──────────────────────────────────────
// Pure, module-scope — never instantiated inside a render loop.
function calculateDistance(from, to) {
  if (!from || !to) return 0
  const R    = 6371
  const dLat = (to.lat - from.lat) * Math.PI / 180
  const dLng = (to.lng - from.lng) * Math.PI / 180
  const a    = Math.sin(dLat / 2) ** 2
            + Math.cos(from.lat * Math.PI / 180)
            * Math.cos(to.lat  * Math.PI / 180)
            * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ── Type × distance altitude lookup table ─────────────────────────────────────
// Buckets: short < 500 km  |  medium 500–2000 km  |  long > 2000 km
const ARC_ALTITUDE_TABLE = {
  missile:    { short: 0.4,  medium: 0.8,  long: 1.5  },
  airstrike:  { short: 0.05, medium: 0.08, long: 0.12 },
  drone:      { short: 0.03, medium: 0.05, long: 0.08 },
  airlift:    { short: 0.08, medium: 0.12, long: 0.18 },
  naval:      { short: 0.0,  medium: 0.0,  long: 0.0  },
  defense:    { short: 0.3,  medium: 0.5,  long: 0.8  },
  ground:     { short: 0.01, medium: 0.02, long: 0.03 },
  deployment: { short: 0.06, medium: 0.1,  long: 0.15 },
}

/**
 * Returns the arc altitude for a given event type and great-circle distance.
 * Naval always returns 0 (sea-level track). Unknown types fall back to 0.08.
 * Explicit per-event arcAltitude overrides are applied upstream in arcStyle().
 * @param {string} type - event.type
 * @param {number} km   - great-circle distance in kilometres
 * @returns {number}
 */
function getArcAltitude(type, km) {
  const row = ARC_ALTITUDE_TABLE[type]
  if (!row) return 0.08
  const bucket = km < 500 ? 'short' : km <= 2000 ? 'medium' : 'long'
  return row[bucket]
}

// ── Per-arc style params ───────────────────────────────────────────────────────
// Stored directly in the arc data object so <Globe> can use plain string accessors
// (e.g. arcDashLength="dl"), keeping useMemo deps stable with no inline functions.
function arcStyle(ev, target) {
  const isNaval      = ev.type === 'naval'
  const isDeployment = DEPLOYMENT_TYPES.has(ev.type)
  const km           = calculateDistance(ev.origin, target)

  // ── Naval: sea-level ship track, wide dashes ───────────────────────────────
  if (isNaval) {
    return {
      altitude: 0,
      dl:       0.4,   // wide dashes — ship track feel
      dg:       0.2,
      animTime: ev.arcSpeed ?? 12000,
      stroke:   2.2,
    }
  }

  // ── Deployment (surface-hugging routes) and airlift (very low) ────────────
  if (isDeployment) {
    const isAirlift = ev.type === 'airlift'
    return {
      // Explicit per-event arcAltitude takes precedence over type×distance table
      altitude: ev.arcAltitude ?? getArcAltitude(ev.type, km),
      // Multiple dashes visible simultaneously = convoy/route feel
      dl:       0.10,
      dg:       0.06,
      animTime: ev.arcSpeed ?? (isAirlift ? 9000 : 16000),
      stroke:   1.8,
    }
  }

  // ── Strike arcs (missile, airstrike, drone, defense, ground) ──────────────
  return {
    // Explicit per-event arcAltitude takes precedence over type×distance table
    altitude: ev.arcAltitude ?? getArcAltitude(ev.type, km),
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
  // Tracks the timestamp of the previous tickKeys frame for time-delta compensation
  const lastKeyTsRef = useRef(null)
  // Guard so the arc altitude debug log only fires once per arcsData recomputation
  const arcLogFiredRef = useRef(false)
  const [dims, setDims] = useState({ w: window.innerWidth, h: window.innerHeight })
  const [ready, setReady] = useState(false)

  // Task 3 — WebGL capability check (lazy initial state, runs once at mount)
  const [webglSupported] = useState(() => {
    try {
      const canvas = document.createElement('canvas')
      return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'))
    } catch { return false }
  })

  // Task 1 — ResizeObserver on the container div so dims track actual layout
  // size, not window size. This stays accurate when sidebars / panels are added.
  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setDims({ w: Math.round(width), h: Math.round(height) })
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  // ── Initialize globe controls ──────────────────────────────────────────────
  // Called by onGlobeReady (WebGL truly initialized); 5000ms timer is a safety
  // fallback for mobile Safari where the callback may fire late or not at all.
  const handleGlobeReady = useCallback(() => {
    if (globeRef.current) {
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
    }
    setReady(true)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 5000)
    return () => clearTimeout(timer)
  }, [])

  // ── Keyboard navigation (WASD / Arrows / +- zoom) ─────────────────────────
  // Listeners on window (capture phase) so Safari fires them reliably without
  // requiring the container div to hold focus — Safari won't fire keydown on
  // non-input divs unless the window listener is used.
  useEffect(() => {
    const NAV_KEYS = new Set(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','+','=','-','_'])

    const onKeyDown = (e) => {
      const key = e.key.toLowerCase()
      if (!NAV_KEYS.has(key)) return
      e.preventDefault()
      keysDown.current.add(key)
      if (!rafKeyRef.current) tickKeys()
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
        lastKeyTsRef.current = null
        return
      }

      // Task 2 — frame-rate compensation: normalise to 60 fps (16.67 ms/frame).
      // delta = 1.0 at exactly 60 fps; < 1.0 when faster; > 1.0 when slower.
      // First frame gets delta = 1 so there is no lurch on key-down.
      const now = performance.now()
      const delta = lastKeyTsRef.current ? (now - lastKeyTsRef.current) / 16.67 : 1
      lastKeyTsRef.current = now

      const pov = globeRef.current.pointOfView()
      let { lat, lng, altitude } = pov
      const keys = keysDown.current

      if (keys.has('w') || keys.has('arrowup'))    lat = Math.min(90,  lat + KEY_PAN_SPEED * delta)
      if (keys.has('s') || keys.has('arrowdown'))  lat = Math.max(-90, lat - KEY_PAN_SPEED * delta)
      if (keys.has('a') || keys.has('arrowleft'))  lng -= KEY_PAN_SPEED * delta
      if (keys.has('d') || keys.has('arrowright')) lng += KEY_PAN_SPEED * delta
      if (keys.has('+') || keys.has('='))          altitude = Math.max(KEY_MIN_ALT, altitude - KEY_ZOOM_STEP * delta)
      if (keys.has('-') || keys.has('_'))          altitude = Math.min(KEY_MAX_ALT,  altitude + KEY_ZOOM_STEP * delta)

      globeRef.current.pointOfView({ lat, lng, altitude }, 120)
      rafKeyRef.current = requestAnimationFrame(tickKeys)
    }

    window.addEventListener('keydown', onKeyDown, true)
    window.addEventListener('keyup', onKeyUp, true)
    return () => {
      window.removeEventListener('keydown', onKeyDown, true)
      window.removeEventListener('keyup', onKeyUp, true)
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

  // ── Arc data — combat strikes, deployments, and naval tracks ──────────────
  // Naval events receive the NAVAL_ARC_COLOR gradient and sea-level altitude
  // regardless of any per-event arcColor override.
  // All other style fields are baked via arcStyle() so Globe can use plain
  // string accessors — keeping useMemo deps stable with no inline functions.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const arcsData = useMemo(() => {
    arcLogFiredRef.current = false  // reset so log fires once per recomputation
    const arcs = activeEvents.flatMap((ev) =>
      (ev.targets ?? []).map((target) => {
        const style    = arcStyle(ev, target)
        const isNaval  = ev.type === 'naval'
        return {
          startLat: ev.origin.lat,
          startLng: ev.origin.lng,
          endLat:   target.lat,
          endLng:   target.lng,
          // Naval gets a forced navy-blue gradient; all others use per-event
          // arcColor if set, falling back to the type's canonical colour.
          color:    isNaval
                      ? NAVAL_ARC_COLOR
                      : (ev.arcColor ?? [getTypeColor(ev.type), getTypeColor(ev.type)]),
          altitude: style.altitude,
          dl:       style.dl,
          dg:       style.dg,
          animTime: style.animTime,
          stroke:   style.stroke,
          event:    ev,
        }
      })
    )

    // Debug log — fires once per unique active-event set change (not every frame)
    if (!arcLogFiredRef.current) {
      arcLogFiredRef.current = true
      console.group('[Globe3D] Arc altitude assignments')
      arcs.forEach((arc) => {
        const km = calculateDistance(
          { lat: arc.startLat, lng: arc.startLng },
          { lat: arc.endLat,   lng: arc.endLng   }
        )
        console.log(
          `${arc.event.title} | type=${arc.event.type} | ${Math.round(km)} km` +
          ` | bucket=${km < 500 ? 'short' : km <= 2000 ? 'medium' : 'long'}` +
          ` | altitude=${arc.altitude}` +
          (arc.event.arcAltitude != null ? ' (override)' : ' (table)')
        )
      })
      console.groupEnd()
    }

    return arcs
  }, [activeEventKey]) // eslint-disable-line react-hooks/exhaustive-deps

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

  // ── WebGL context loss / restoration ─────────────────────────────────────
  // The browser can revoke a WebGL context at any time (memory pressure, GPU
  // reset, driver crash). Without interception the globe freezes silently.
  // Calling e.preventDefault() stops Three.js from receiving the event so it
  // does not try to render against the lost context. Setting ready=false shows
  // the "INITIALIZING..." overlay while the OS recovers the GPU. On restore,
  // a 500 ms delay lets the driver finish re-initialising before we hand
  // control back to the globe.
  // Dep: [ready] — we re-run only when ready flips so we always bind to the
  // canvas that is currently live (context loss can only happen after ready).
  useEffect(() => {
    if (!ready || !globeRef.current) return
    const renderer = globeRef.current.renderer?.()
    const canvas = renderer?.domElement
    if (!canvas) return
    const handleContextLost = (e) => {
      e.preventDefault()
      setReady(false)  // triggers loading overlay while context recovers
    }
    const handleContextRestored = () => {
      setTimeout(() => setReady(true), 500)
    }
    canvas.addEventListener('webglcontextlost', handleContextLost)
    canvas.addEventListener('webglcontextrestored', handleContextRestored)
    return () => {
      canvas.removeEventListener('webglcontextlost', handleContextLost)
      canvas.removeEventListener('webglcontextrestored', handleContextRestored)
    }
  }, [ready])

  // Reset cursor when arcsData cycles (live mode swaps arcs every 3.5 s without
  // firing a null hover event, leaving the cursor stuck as a pointer).
  useEffect(() => {
    document.body.style.cursor = 'auto'
  }, [arcsData])

  // ── Stable Globe prop callbacks ────────────────────────────────────────────
  // Dep arrays are empty: these only touch document.body and datum fields that
  // are stable string/primitive values — no component state or props involved.
  const arcLabel     = useCallback((d) => d.event?.title, [])
  const onArcHover   = useCallback((arc) => { document.body.style.cursor = arc ? 'pointer' : 'auto' }, [])
  const pointLabel   = useCallback((d) => d.label, [])
  const onPointHover = useCallback((pt) => { document.body.style.cursor = pt ? 'pointer' : 'auto' }, [])

  // Task 3 — WebGL fallback: render before the globe tree so no Three.js
  // initialisation is attempted on hardware where WebGL is unavailable.
  if (!webglSupported) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="text-red-500 text-lg font-bold tracking-widest">WEBGL UNAVAILABLE</div>
          <div className="text-green-700 text-xs mt-2">Enable hardware acceleration in browser settings</div>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full outline-none"
      tabIndex={0}
      style={{ touchAction: 'none' }}
      onMouseDown={() => containerRef.current?.focus()}
      onTouchStart={() => containerRef.current?.focus()}
    >
      <Globe
        ref={globeRef}
        width={dims.w}
        height={dims.h}

        globeImageUrl="/textures/earth-night.jpg"
        backgroundImageUrl="/textures/night-sky.png"
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
        arcLabel={arcLabel}
        onArcClick={handleArcClick}
        onArcHover={onArcHover}

        // ── Points ────────────────────────────────────────────────────────────
        pointsData={pointsData}
        pointLat="lat"
        pointLng="lng"
        pointColor="color"
        pointAltitude="altitude"
        pointRadius="size"
        pointsMerge={false}
        pointLabel={pointLabel}
        onPointClick={handlePointClick}
        onPointHover={onPointHover}

        // ── HTML labels ───────────────────────────────────────────────────────
        htmlElementsData={htmlData}
        htmlLat="lat"
        htmlLng="lng"
        htmlAltitude={0.015}
        htmlElement={htmlElement}

        enablePointerInteraction={true}
        animateIn={false}
        waitForGlobeReady={false}
        onGlobeReady={handleGlobeReady}
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
