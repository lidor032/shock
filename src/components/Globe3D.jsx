import { useRef, useEffect, useState, useCallback } from 'react'
import Globe from 'react-globe.gl'
import { getTypeColor, getImportanceColor } from '../utils/colors'

// Middle East center
const INIT_LAT = 31
const INIT_LNG  = 44
const INIT_ALT  = 1.8

export default function Globe3D({ events, activeEvents, selectedEvent, onEventClick }) {
  const globeRef  = useRef()
  const [dims, setDims] = useState({ w: window.innerWidth, h: window.innerHeight })
  const [ready, setReady] = useState(false)

  // Track window size
  useEffect(() => {
    const handler = () => setDims({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  // Center on Middle East on mount
  useEffect(() => {
    if (!globeRef.current) return
    const timer = setTimeout(() => {
      globeRef.current.pointOfView({ lat: INIT_LAT, lng: INIT_LNG, altitude: INIT_ALT }, 1500)
      setReady(true)
    }, 400)
    return () => clearTimeout(timer)
  }, [])

  // ── Build arc data ─────────────────────────────────────────────────────────
  const arcs = activeEvents.flatMap((ev) =>
    (ev.targets ?? []).map((target) => ({
      startLat: ev.origin.lat,
      startLng: ev.origin.lng,
      endLat:   target.lat,
      endLng:   target.lng,
      color:    ev.arcColor ?? [getTypeColor(ev.type), getTypeColor(ev.type)],
      altitude: ev.arcAltitude ?? 0.3,
      animTime: ev.arcSpeed ?? 1800,
      event:    ev,
    }))
  )

  // ── Build point data (all event origins + targets) ─────────────────────────
  const activeIds = new Set(activeEvents.map((e) => e.id))

  const points = events.flatMap((ev) => {
    const isActive   = activeIds.has(ev.id)
    const isSelected = selectedEvent?.id === ev.id
    const color      = getImportanceColor(ev.importance)

    const pts = [
      {
        lat:   ev.origin.lat,
        lng:   ev.origin.lng,
        label: ev.origin.label,
        size:  isSelected ? 0.6 : isActive ? 0.45 : 0.25,
        color: isActive ? color : `${color}55`,
        altitude: 0.005,
        event: ev,
      },
    ]

    if (isActive) {
      ev.targets?.forEach((t) => {
        pts.push({
          lat:   t.lat,
          lng:   t.lng,
          label: t.label,
          size:  0.4,
          color: '#ff2222',
          altitude: 0.005,
          event: ev,
        })
      })
    }

    return pts
  })

  // ── Build HTML labels for active events ───────────────────────────────────
  const labels = activeEvents.map((ev) => ({
    lat:   ev.origin.lat,
    lng:   ev.origin.lng,
    text:  ev.origin.label,
    color: getTypeColor(ev.type),
    size:  0.6,
  }))

  // ── Click handler ──────────────────────────────────────────────────────────
  const handlePointClick = useCallback((pt) => {
    if (pt?.event) {
      onEventClick(pt.event)
      // Fly to the event
      if (globeRef.current) {
        globeRef.current.pointOfView(
          { lat: pt.lat, lng: pt.lng, altitude: 1.0 },
          800
        )
      }
    }
  }, [onEventClick])

  const handleArcClick = useCallback((arc) => {
    if (arc?.event) onEventClick(arc.event)
  }, [onEventClick])

  // ── HTML element for labels ────────────────────────────────────────────────
  const htmlLabel = useCallback((d) => {
    const el = document.createElement('div')
    el.className = 'event-label'
    el.textContent = d.text
    el.style.color = d.color
    el.style.borderColor = `${d.color}88`
    el.style.textShadow = `0 0 6px ${d.color}`
    return el
  }, [])

  return (
    <div className="w-full h-full">
      <Globe
        ref={globeRef}
        width={dims.w}
        height={dims.h}

        // Textures
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"

        // Atmosphere — military green
        atmosphereColor="#00cc44"
        atmosphereAltitude={0.18}

        // ── Arcs (missiles / drones / airstrikes) ──────────────────────────
        arcsData={arcs}
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

        // ── Points (event markers) ─────────────────────────────────────────
        pointsData={points}
        pointLat="lat"
        pointLng="lng"
        pointColor="color"
        pointAltitude="altitude"
        pointRadius="size"
        pointsMerge={false}
        pointLabel={(d) => d.label}
        onPointClick={handlePointClick}
        onPointHover={(pt) => { document.body.style.cursor = pt ? 'pointer' : 'auto' }}

        // ── HTML labels ────────────────────────────────────────────────────
        htmlElementsData={labels}
        htmlLat="lat"
        htmlLng="lng"
        htmlAltitude={0.015}
        htmlElement={htmlLabel}

        // ── Interaction ────────────────────────────────────────────────────
        enablePointerInteraction={true}
        animateIn={false}
      />

      {/* Loading overlay */}
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
