import { useState, useEffect, useRef, useCallback } from 'react'
import { TIMELINE_START, TIMELINE_END } from '../data/events'

// How many ms of real time = 1 ms of game time at 1x speed
// 1 real second = 1 game day at 1x  →  speed multiplier = 86400
const MS_PER_REAL_MS_AT_1X = 86400

// How long an event's arc stays visible in timeline mode (ms of game time)
const ARC_VISIBLE_WINDOW = 12 * 60 * 60 * 1000 // 12 game-hours

// Live mode: how often to cycle which events are shown (ms real time)
const LIVE_CYCLE_INTERVAL = 3500

export function useSimulation({ mode, currentTime, isPlaying, speed, events, setCurrentTime }) {
  const rafRef = useRef(null)
  const lastRealTsRef = useRef(null)

  // ── TIMELINE PLAYBACK ───────────────────────────────────────────────────────
  useEffect(() => {
    if (mode !== 'timeline' || !isPlaying) {
      lastRealTsRef.current = null
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      return
    }

    const tick = (realTs) => {
      if (lastRealTsRef.current !== null) {
        const realDelta = realTs - lastRealTsRef.current
        const gameDelta = realDelta * MS_PER_REAL_MS_AT_1X * speed
        setCurrentTime((prev) => {
          const next = prev + gameDelta
          if (next >= TIMELINE_END) return TIMELINE_START
          return next
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
  }, [mode, isPlaying, speed, setCurrentTime])

  // Timeline active events: events within the trailing window
  const activeEvents = events.filter((ev) => {
    return ev.timestamp <= currentTime && ev.timestamp >= currentTime - ARC_VISIBLE_WINDOW
  })

  // ── LIVE MODE ────────────────────────────────────────────────────────────────
  const [liveActive, setLiveActive] = useState(() => pickRandom(events, 3))
  const liveIndexRef = useRef(0)

  useEffect(() => {
    if (mode !== 'live') return

    // Seed immediately
    setLiveActive(pickRandom(events, 3))

    const interval = setInterval(() => {
      // Rotate: drop oldest, add one new random (avoid duplicate)
      setLiveActive((prev) => {
        const prevIds = new Set(prev.map((e) => e.id))
        const pool = events.filter((e) => !prevIds.has(e.id))
        if (pool.length === 0) return pickRandom(events, 3)
        const next = pool[Math.floor(Math.random() * pool.length)]
        return [...prev.slice(-2), next]
      })
    }, LIVE_CYCLE_INTERVAL)

    return () => clearInterval(interval)
  }, [mode, events])

  return {
    activeEvents: mode === 'timeline' ? activeEvents : liveActive,
    liveActive,
  }
}

function pickRandom(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, n)
}
