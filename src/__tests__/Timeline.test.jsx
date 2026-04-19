import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Timeline from '../components/Timeline'

// ── Minimal mock events ──────────────────────────────────────────────────────
// startTime and endTime used in all tests
const START = 1_000_000_000_000   // arbitrary epoch ms
const END   = START + 100_000     // +100 000 ms (covers all test midpoints)
const MID   = START + 50_000      // exact halfway point

// Full set of required props so the component renders without crashing
const makeProps = (overrides = {}) => ({
  events:        [],
  currentTime:   START,
  isPlaying:     false,
  speed:         1,
  startTime:     START,
  endTime:       END,
  onTimeChange:  vi.fn(),
  onPlayPause:   vi.fn(),
  onSpeedChange: vi.fn(),
  onEventClick:  vi.fn(),
  ...overrides,
})

// Helper: extract the slider's numeric value from the rendered DOM
const getSliderValue = (container) =>
  Number(container.querySelector('input[type="range"]').value)

// ── sliderValue calculation ──────────────────────────────────────────────────
describe('Timeline sliderValue calculation', () => {
  it('is 0 when currentTime === startTime', () => {
    const { container } = render(<Timeline {...makeProps({ currentTime: START })} />)
    expect(getSliderValue(container)).toBe(0)
  })

  it('is 1000 when currentTime === endTime', () => {
    const { container } = render(<Timeline {...makeProps({ currentTime: END })} />)
    expect(getSliderValue(container)).toBe(1000)
  })

  it('is 500 when currentTime is exactly halfway', () => {
    const { container } = render(<Timeline {...makeProps({ currentTime: MID })} />)
    expect(getSliderValue(container)).toBe(500)
  })

  it('is clamped to 0 when currentTime < startTime', () => {
    const { container } = render(<Timeline {...makeProps({ currentTime: START - 99_999 })} />)
    expect(getSliderValue(container)).toBe(0)
  })

  it('is clamped to 1000 when currentTime > endTime', () => {
    const { container } = render(<Timeline {...makeProps({ currentTime: END + 99_999 })} />)
    expect(getSliderValue(container)).toBe(1000)
  })

  it('is 0 (not NaN) when startTime === endTime (zero-duration guard)', () => {
    const { container } = render(
      <Timeline {...makeProps({ currentTime: START, startTime: START, endTime: START })} />
    )
    const value = getSliderValue(container)
    expect(Number.isNaN(value)).toBe(false)
    expect(value).toBe(0)
  })
})

// ── visibleEvents filter ─────────────────────────────────────────────────────
describe('Timeline visibleEvents filter', () => {
  // Minimal event shape that satisfies everything Timeline accesses:
  // timestamp, id, importance (optional — component guards via conditional)
  const makeEvent = (id, timestamp, importance = 'major') => ({
    id,
    timestamp,
    title:     `Event ${id}`,
    importance,
    origin:    { lat: 0, lng: 0, label: 'Origin' },
    targets:   [{ lat: 1, lng: 1 }],
  })

  const inside1 = makeEvent(1, START)          // at startTime boundary — included
  const inside2 = makeEvent(2, MID)            // exactly midpoint — included
  const inside3 = makeEvent(3, END)            // at endTime boundary — included
  const before  = makeEvent(4, START - 1)      // 1 ms before startTime — excluded
  const after   = makeEvent(5, END   + 1)      // 1 ms after endTime — excluded

  it('only shows events within [startTime, endTime]', () => {
    const { container } = render(
      <Timeline
        {...makeProps({ events: [inside1, inside2, inside3, before, after] })}
      />
    )
    // Each visible event renders as a <button> inside the dot row.
    // The control row also has buttons (play/pause, speed), so we count by
    // checking for the data attribute we can infer from key (ev.id).
    // More reliably: count total <button> elements minus the fixed control buttons.
    // Fixed control buttons: 1 play/pause + 4 speed (1×, 5×, 20×, 100×) = 5
    const allButtons = container.querySelectorAll('button')
    const controlButtonCount = 5 // play/pause + 4 speed buttons
    const eventDotButtons = allButtons.length - controlButtonCount
    expect(eventDotButtons).toBe(3)
  })

  it('excludes events before startTime', () => {
    const { container } = render(
      <Timeline {...makeProps({ events: [before] })} />
    )
    const allButtons = container.querySelectorAll('button')
    const controlButtonCount = 5
    const eventDotButtons = allButtons.length - controlButtonCount
    expect(eventDotButtons).toBe(0)
  })

  it('excludes events after endTime', () => {
    const { container } = render(
      <Timeline {...makeProps({ events: [after] })} />
    )
    const allButtons = container.querySelectorAll('button')
    const controlButtonCount = 5
    const eventDotButtons = allButtons.length - controlButtonCount
    expect(eventDotButtons).toBe(0)
  })
})
