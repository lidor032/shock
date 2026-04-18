import { useState, useEffect, useRef, useMemo } from 'react'
import { TIMELINE_START, TIMELINE_END } from '../data/events'

const MS_PER_REAL_MS_AT_1X = 86400           // 1 real second = 1 game day at 1×
const ARC_VISIBLE_WINDOW   = 12 * 60 * 60 * 1000  // 12 game-hours
const LIVE_CYCLE_INTERVAL  = 3500

export function useSimulation({
  mode,
  currentTime,
  isPlaying,
  speed,
  events,
  setCurrentTime,
  startTime = TIMELINE_START,
  endTime   = TIMELINE_END,
}) {
  const rafRef         = useRef(null)
  const lastRealTsRef  = useRef(null)

  // Keep refs current so the RAF tick always uses the latest campaign bounds
  // without needing to restart the animation loop on every campaign switch.
  const startTimeRef = useRef(startTime)
  const endTimeRef   = useRef(endTime)
  const speedRef     = useRef(speed)
  useEffect(() => { startTimeRef.current = startTime }, [startTime])
  useEffect(() => { endTimeRef.current   = endTime   }, [endTime])
  useEffect(() => { speedRef.current     = speed     }, [speed])

  // ── TIMELINE PLAYBACK ──────────────────────────────────────────────────────
  useEffect(() => {
    if (mode !== 'timeline' || !isPlaying) {
      lastRealTsRef.current = null
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      return
    }

    const tick = (realTs) => {
      if (lastRealTsRef.current !== null) {
        const realDelta = realTs - lastRealTsRef.current
        const gameDelta = realDelta * MS_PER_REAL_MS_AT_1X * speedRef.current
        setCurrentTime((prev) => {
          const next = prev + gameDelta
          return next >= endTimeRef.current ? startTimeRef.current : next
        })
      }
      lastRealTsRef.current = realTs
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      lastRealTsRef.current = null
    }
  }, [mode, isPlaying, setCurrentTime])

  // ── TIMELINE ACTIVE EVENTS — stable reference ──────────────────────────────
  // Filter every frame but only return a new array reference when the set of
  // visible event IDs actually changes, so Globe3D's useMemo doesn't re-fire
  // on every single RAF tick.
  const stableActiveRef = useRef([])
  const stableKeyRef    = useRef('')

  const timelineActive = useMemo(() => {
    const filtered = events.filter(
      (ev) => ev.timestamp <= currentTime && ev.timestamp >= currentTime - ARC_VISIBLE_WINDOW
    )
    const key = filtered.map((e) => e.id).sort().join(',')
    if (key !== stableKeyRef.current) {
      stableKeyRef.current  = key
      stableActiveRef.current = filtered
    }
    return stableActiveRef.current
  }, [events, currentTime])

  // ── LIVE MODE ─────────────────────────────────────────────────────────────
  const [liveActive, setLiveActive] = useState(() => pickRandom(events, 3))

  useEffect(() => {
    if (mode !== 'live') return
    setLiveActive(pickRandom(events, 3))

    const interval = setInterval(() => {
      setLiveActive((prev) => {
        const prevIds = new Set(prev.map((e) => e.id))
        const pool    = events.filter((e) => !prevIds.has(e.id))
        const next    = pool.length
          ? pool[Math.floor(Math.random() * pool.length)]
          : events[Math.floor(Math.random() * events.length)]
        return [...prev.slice(-2), next]
      })
    }, LIVE_CYCLE_INTERVAL)

    return () => clearInterval(interval)
  }, [mode, events])

  return {
    activeEvents: mode === 'timeline' ? timelineActive : liveActive,
    liveActive,
  }
}

function pickRandom(arr, n) {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n)
}
