import { describe, it, expect } from 'vitest'
import { getTypeColor, getImportanceColor, getCountryColor, getTypeIcon } from './colors'
import { EVENT_TYPES, COUNTRIES } from '../data/events'

describe('getTypeColor', () => {
  it('returns a hex string for every EVENT_TYPES value', () => {
    for (const type of Object.values(EVENT_TYPES)) {
      const color = getTypeColor(type)
      expect(typeof color).toBe('string')
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/)
    }
  })

  it('returns fallback #00ff41 for unknown type', () => {
    expect(getTypeColor('unknown')).toBe('#00ff41')
    expect(getTypeColor(undefined)).toBe('#00ff41')
    expect(getTypeColor(null)).toBe('#00ff41')
  })
})

describe('getImportanceColor', () => {
  it('returns a string for known importance levels', () => {
    for (const level of ['critical', 'major', 'moderate', 'minor']) {
      const color = getImportanceColor(level)
      expect(typeof color).toBe('string')
      expect(color.length).toBeGreaterThan(0)
    }
  })

  it('returns fallback for unknown importance', () => {
    expect(typeof getImportanceColor('unknown')).toBe('string')
    expect(typeof getImportanceColor(undefined)).toBe('string')
  })
})

describe('getCountryColor', () => {
  it('returns a string for every COUNTRIES value', () => {
    for (const country of Object.values(COUNTRIES)) {
      const color = getCountryColor(country)
      expect(typeof color).toBe('string')
      expect(color.length).toBeGreaterThan(0)
    }
  })

  it('returns fallback for unknown country', () => {
    expect(getCountryColor('Unknown')).toBe('#888888')
  })
})

describe('getTypeIcon', () => {
  it('returns a string for every EVENT_TYPES value', () => {
    for (const type of Object.values(EVENT_TYPES)) {
      expect(typeof getTypeIcon(type)).toBe('string')
    }
  })

  it('returns fallback 📍 for unknown type', () => {
    expect(getTypeIcon('unknown')).toBe('📍')
  })
})
