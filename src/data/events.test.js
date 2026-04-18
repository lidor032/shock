import { describe, it, expect } from 'vitest'
import { events, EVENT_TYPES, COUNTRIES, campaigns, TIMELINE_START, TIMELINE_END } from './events'

const VALID_TYPES = new Set(Object.values(EVENT_TYPES))
const VALID_COUNTRIES = new Set(Object.values(COUNTRIES))
const VALID_IMPORTANCE = new Set(['critical', 'major', 'moderate', 'minor'])

describe('events array', () => {
  it('is non-empty', () => {
    expect(events.length).toBeGreaterThan(0)
  })

  it('has no duplicate IDs', () => {
    const ids = events.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('is sorted by timestamp ascending', () => {
    for (let i = 1; i < events.length; i++) {
      expect(events[i].timestamp).toBeGreaterThanOrEqual(events[i - 1].timestamp)
    }
  })

  it('every event has required scalar fields', () => {
    for (const ev of events) {
      expect(typeof ev.id, `id on event ${ev.id}`).toBe('number')
      expect(typeof ev.timestamp, `timestamp on event ${ev.id}`).toBe('number')
      expect(isFinite(ev.timestamp), `timestamp finite on event ${ev.id}`).toBe(true)
      expect(typeof ev.title, `title on event ${ev.id}`).toBe('string')
      expect(ev.title.length, `title non-empty on event ${ev.id}`).toBeGreaterThan(0)
      expect(typeof ev.date, `date on event ${ev.id}`).toBe('string')
    }
  })

  it('every event has a valid type', () => {
    for (const ev of events) {
      expect(VALID_TYPES.has(ev.type), `type "${ev.type}" on event ${ev.id}`).toBe(true)
    }
  })

  it('every event has a valid country', () => {
    for (const ev of events) {
      expect(VALID_COUNTRIES.has(ev.country), `country "${ev.country}" on event ${ev.id}`).toBe(true)
    }
  })

  it('every event has valid origin coords', () => {
    for (const ev of events) {
      expect(isFinite(ev.origin?.lat), `origin.lat on event ${ev.id}`).toBe(true)
      expect(isFinite(ev.origin?.lng), `origin.lng on event ${ev.id}`).toBe(true)
      expect(typeof ev.origin?.label, `origin.label on event ${ev.id}`).toBe('string')
    }
  })

  it('every event has at least one valid target', () => {
    for (const ev of events) {
      expect(Array.isArray(ev.targets), `targets array on event ${ev.id}`).toBe(true)
      expect(ev.targets.length, `targets non-empty on event ${ev.id}`).toBeGreaterThan(0)
      for (const t of ev.targets) {
        expect(isFinite(t.lat), `target lat on event ${ev.id}`).toBe(true)
        expect(isFinite(t.lng), `target lng on event ${ev.id}`).toBe(true)
      }
    }
  })

  it('arcColor is a 2-element array of strings when present', () => {
    for (const ev of events) {
      if (ev.arcColor !== undefined) {
        expect(Array.isArray(ev.arcColor), `arcColor array on event ${ev.id}`).toBe(true)
        expect(ev.arcColor.length, `arcColor length on event ${ev.id}`).toBe(2)
        expect(typeof ev.arcColor[0], `arcColor[0] string on event ${ev.id}`).toBe('string')
        expect(typeof ev.arcColor[1], `arcColor[1] string on event ${ev.id}`).toBe('string')
      }
    }
  })

  it('simulated events have simulated: true', () => {
    const simulatedIds = [22, 23, 24]
    for (const ev of events) {
      if (simulatedIds.includes(ev.id)) {
        expect(ev.simulated, `simulated flag on event ${ev.id}`).toBe(true)
      }
    }
  })

  it('importance values are valid when present', () => {
    for (const ev of events) {
      if (ev.importance !== undefined) {
        expect(VALID_IMPORTANCE.has(ev.importance), `importance "${ev.importance}" on event ${ev.id}`).toBe(true)
      }
    }
  })
})

describe('campaigns', () => {
  it('has at least one campaign', () => {
    expect(campaigns.length).toBeGreaterThan(0)
  })

  it('every campaign has id, name, start, end', () => {
    for (const c of campaigns) {
      expect(typeof c.id).toBe('string')
      expect(typeof c.name).toBe('string')
      expect(isFinite(c.start)).toBe(true)
      expect(isFinite(c.end)).toBe(true)
      expect(c.end).toBeGreaterThan(c.start)
    }
  })
})

describe('TIMELINE constants', () => {
  it('TIMELINE_START is finite', () => expect(isFinite(TIMELINE_START)).toBe(true))
  it('TIMELINE_END is finite', () => expect(isFinite(TIMELINE_END)).toBe(true))
  it('TIMELINE_END is after TIMELINE_START', () => expect(TIMELINE_END).toBeGreaterThan(TIMELINE_START))
})
