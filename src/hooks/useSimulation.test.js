import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSimulation } from './useSimulation'

const makeEvents = (timestamps) =>
  timestamps.map((ts, i) => ({ id: i + 1, timestamp: ts }))

const BASE_START = 1000000
const BASE_END   = BASE_START + 48 * 60 * 60 * 1000  // +48 game hours

describe('useSimulation — timeline mode', () => {
  it('activeEvents is empty when currentTime is before earliest event', () => {
    const events = makeEvents([BASE_START + 20 * 3600 * 1000])
    const setCurrentTime = vi.fn()
    const { result } = renderHook(() =>
      useSimulation({ mode: 'timeline', currentTime: BASE_START, isPlaying: false, speed: 1, events, setCurrentTime, startTime: BASE_START, endTime: BASE_END })
    )
    expect(result.current.activeEvents).toHaveLength(0)
  })

  it('activeEvents contains events within the 12-hour visibility window', () => {
    const t = BASE_START + 6 * 3600 * 1000
    const events = makeEvents([t])
    const setCurrentTime = vi.fn()
    const { result } = renderHook(() =>
      useSimulation({ mode: 'timeline', currentTime: t + 1000, isPlaying: false, speed: 1, events, setCurrentTime, startTime: BASE_START, endTime: BASE_END })
    )
    expect(result.current.activeEvents).toHaveLength(1)
  })

  it('activeEvents excludes events older than 12 hours', () => {
    const t = BASE_START
    const events = makeEvents([t])
    const currentTime = t + 13 * 3600 * 1000  // 13h after event — outside 12h window
    const setCurrentTime = vi.fn()
    const { result } = renderHook(() =>
      useSimulation({ mode: 'timeline', currentTime, isPlaying: false, speed: 1, events, setCurrentTime, startTime: BASE_START, endTime: BASE_END })
    )
    expect(result.current.activeEvents).toHaveLength(0)
  })

  it('returns a stable array reference when visible event set unchanged', () => {
    const t = BASE_START + 3600 * 1000
    const events = makeEvents([t])
    const setCurrentTime = vi.fn()
    let currentTime = t + 1000
    const { result, rerender } = renderHook(({ ct }) =>
      useSimulation({ mode: 'timeline', currentTime: ct, isPlaying: false, speed: 1, events, setCurrentTime, startTime: BASE_START, endTime: BASE_END }),
      { initialProps: { ct: currentTime } }
    )
    const first = result.current.activeEvents
    rerender({ ct: currentTime + 500 })  // same event still in window
    expect(result.current.activeEvents).toBe(first)
  })
})

describe('useSimulation — live mode', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('starts with 3 active events', () => {
    const events = makeEvents(Array.from({ length: 10 }, (_, i) => BASE_START + i * 1000))
    const setCurrentTime = vi.fn()
    const { result } = renderHook(() =>
      useSimulation({ mode: 'live', currentTime: BASE_START, isPlaying: false, speed: 1, events, setCurrentTime, startTime: BASE_START, endTime: BASE_END })
    )
    expect(result.current.activeEvents).toHaveLength(3)
  })
})
