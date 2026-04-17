import { EVENT_TYPES, COUNTRIES } from '../data/events'

export const TYPE_COLORS = {
  [EVENT_TYPES.MISSILE]:    { primary: '#ff2222', glow: 'rgba(255,34,34,0.6)',    label: 'Missile / Rocket',          icon: '🚀' },
  [EVENT_TYPES.AIRSTRIKE]:  { primary: '#0088ff', glow: 'rgba(0,136,255,0.6)',    label: 'Airstrike',                 icon: '✈️' },
  [EVENT_TYPES.DRONE]:      { primary: '#ff8800', glow: 'rgba(255,136,0,0.6)',    label: 'Drone Attack',              icon: '🛸' },
  [EVENT_TYPES.NAVAL]:      { primary: '#00ccff', glow: 'rgba(0,204,255,0.6)',    label: 'Naval Operation',           icon: '⚓' },
  [EVENT_TYPES.DEFENSE]:    { primary: '#00ff88', glow: 'rgba(0,255,136,0.6)',    label: 'Defense / Diplomacy',       icon: '🛡️' },
  [EVENT_TYPES.GROUND]:     { primary: '#ffdd00', glow: 'rgba(255,221,0,0.6)',    label: 'Ground Operation',          icon: '🪖' },
  [EVENT_TYPES.DEPLOYMENT]: { primary: '#7ab8f5', glow: 'rgba(122,184,245,0.5)', label: 'Force Deployment / Naval',  icon: '🚢' },
  [EVENT_TYPES.AIRLIFT]:    { primary: '#c8d8e8', glow: 'rgba(200,216,232,0.5)', label: 'Airlift / Logistics',       icon: '🛫' },
}

export const COUNTRY_COLORS = {
  [COUNTRIES.IRAN]:      '#cc0000',
  [COUNTRIES.ISRAEL]:    '#0055cc',
  [COUNTRIES.USA]:       '#ffffff',
  [COUNTRIES.HEZBOLLAH]: '#cc6600',
  [COUNTRIES.HOUTHI]:    '#cc9900',
  [COUNTRIES.IRAQ_PMF]:  '#884400',
}

export const IMPORTANCE_COLORS = {
  critical: '#ff2222',
  major:    '#ffaa00',
  moderate: '#00ff41',
  minor:    '#557755',
}

export function getTypeColor(type) {
  return TYPE_COLORS[type]?.primary ?? '#00ff41'
}

export function getCountryColor(country) {
  return COUNTRY_COLORS[country] ?? '#888888'
}

export function getImportanceColor(importance) {
  return IMPORTANCE_COLORS[importance] ?? '#00ff41'
}

export function getTypeIcon(type) {
  return TYPE_COLORS[type]?.icon ?? '📍'
}
