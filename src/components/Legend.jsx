import { TYPE_COLORS, COUNTRY_COLORS } from '../utils/colors'
import { EVENT_TYPES, COUNTRIES } from '../data/events'
import { useState } from 'react'

// Strike types — fast projectile events
const STRIKE_TYPES = [
  EVENT_TYPES.MISSILE,
  EVENT_TYPES.AIRSTRIKE,
  EVENT_TYPES.DRONE,
  EVENT_TYPES.NAVAL,
  EVENT_TYPES.DEFENSE,
  EVENT_TYPES.GROUND,
]

// Logistical movement types — slow surface/low-altitude routes
const MOVEMENT_TYPES = [
  EVENT_TYPES.DEPLOYMENT,
  EVENT_TYPES.AIRLIFT,
]

export default function Legend() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="absolute bottom-4 right-4 z-30 fade-in">
      <div className="mil-panel border-glow rounded p-3 min-w-44">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-between text-xs text-green-500 glow mb-2"
        >
          <span className="tracking-widest font-bold">LEGEND</span>
          <span>{collapsed ? '▲' : '▼'}</span>
        </button>

        {!collapsed && (
          <div className="space-y-3">
            {/* Combat strike types */}
            <div>
              <div className="text-green-700 text-xs tracking-widest mb-1">STRIKE TYPE</div>
              {STRIKE_TYPES.map((type) => {
                const meta = TYPE_COLORS[type]
                if (!meta) return null
                return (
                  <div key={type} className="flex items-center gap-2 mb-1">
                    <ProjectileArcSwatch color={meta.primary} />
                    <span className="text-xs text-green-400">{meta.icon} {meta.label}</span>
                  </div>
                )
              })}
            </div>

            <div className="border-t border-green-900" />

            {/* Force deployment / logistics */}
            <div>
              <div className="text-green-700 text-xs tracking-widest mb-1">DEPLOYMENTS</div>
              {MOVEMENT_TYPES.map((type) => {
                const meta = TYPE_COLORS[type]
                if (!meta) return null
                return (
                  <div key={type} className="flex items-center gap-2 mb-1">
                    <DeploymentArcSwatch color={meta.primary} flat={type === EVENT_TYPES.DEPLOYMENT} />
                    <span className="text-xs" style={{ color: meta.primary }}>
                      {meta.icon} {meta.label}
                    </span>
                  </div>
                )
              })}
              <div className="text-green-900 text-xs mt-1 leading-tight">
                Slow dashed route · surface-level
              </div>
            </div>

            <div className="border-t border-green-900" />

            {/* Countries */}
            <div>
              <div className="text-green-700 text-xs tracking-widest mb-1">ACTOR</div>
              {Object.entries(COUNTRY_COLORS).map(([country, color]) => (
                <div key={country} className="flex items-center gap-2 mb-1">
                  <DotSwatch color={color} />
                  <span className="text-xs text-green-400">{country}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-green-900" />

            {/* Importance */}
            <div className="text-xs text-green-700">
              <div className="flex items-center gap-2"><span className="text-red-400 font-bold text-base">●</span> Critical event</div>
              <div className="flex items-center gap-2 mt-0.5"><span className="text-yellow-400 font-bold text-sm">●</span> Major event</div>
            </div>

            <div className="border-t border-green-900 pt-1">
              <div className="text-green-800 text-xs italic">
                🔶 SIMULATED events marked
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Short fast dash — represents a projectile/strike arc
function ProjectileArcSwatch({ color }) {
  return (
    <svg width="28" height="10" viewBox="0 0 28 10">
      <path d="M 2 8 Q 14 0 26 8" stroke={color} strokeWidth="2" fill="none" strokeDasharray="4 2" />
    </svg>
  )
}

// Longer, more spaced dashes — represents a slow logistical convoy route.
// flat=true draws a straight line (naval surface route); false curves slightly (airlift).
function DeploymentArcSwatch({ color, flat }) {
  const d = flat
    ? 'M 2 8 L 26 8'                  // straight line — hugs surface (naval)
    : 'M 2 8 Q 14 3 26 8'            // very slight curve — airlift
  return (
    <svg width="28" height="10" viewBox="0 0 28 10">
      <path d={d} stroke={color} strokeWidth="2.2" fill="none" strokeDasharray="5 3" opacity="0.85" />
    </svg>
  )
}

function DotSwatch({ color }) {
  return (
    <span
      className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
      style={{ background: color, boxShadow: `0 0 4px ${color}` }}
    />
  )
}
