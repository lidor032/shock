import { TYPE_COLORS, COUNTRY_COLORS } from '../utils/colors'
import { EVENT_TYPES, COUNTRIES } from '../data/events'
import { useState } from 'react'

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
            {/* Event types */}
            <div>
              <div className="text-green-700 text-xs tracking-widest mb-1">STRIKE TYPE</div>
              {Object.entries(TYPE_COLORS).map(([type, meta]) => (
                <div key={type} className="flex items-center gap-2 mb-1">
                  <ArcSwatch color={meta.primary} />
                  <span className="text-xs text-green-400">{meta.icon} {meta.label}</span>
                </div>
              ))}
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

function ArcSwatch({ color }) {
  return (
    <svg width="28" height="10" viewBox="0 0 28 10">
      <path d="M 2 8 Q 14 0 26 8" stroke={color} strokeWidth="2" fill="none" strokeDasharray="4 2" />
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
