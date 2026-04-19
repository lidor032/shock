import { getTypeColor, getTypeIcon, getImportanceColor, getCountryColor } from '../utils/colors'
import { format } from 'date-fns'

export default function EventCard({ event, onClose, onWatchVideo }) {
  if (!event) return null

  const typeColor   = getTypeColor(event.type)
  const impColor    = getImportanceColor(event.importance)
  const countryColor = getCountryColor(event.country)

  return (
    <div
      className="absolute right-0 left-0 bottom-0 top-auto sm:right-4 sm:left-auto sm:top-28 sm:bottom-20 z-30 w-full sm:w-80 fade-in flex flex-col rounded-t-xl sm:rounded-none max-h-[60vh] sm:max-h-[calc(100vh-180px)]"
    >
      <div
        className="mil-panel rounded flex flex-col overflow-hidden"
        style={{
          border: `1px solid ${typeColor}44`,
          boxShadow: `0 0 20px ${typeColor}22, inset 0 0 20px rgba(0,0,0,0.5)`,
        }}
      >
        {/* Header */}
        <div
          className="px-3 py-2 flex items-start justify-between gap-2"
          style={{ borderBottom: `1px solid ${typeColor}33` }}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">{getTypeIcon(event.type)}</span>
              {event.importance === 'critical' && (
                <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: `${impColor}22`, color: impColor, border: `1px solid ${impColor}44` }}>
                  ◉ CRITICAL
                </span>
              )}
              {event.simulated && (
                <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-yellow-950 text-yellow-400 border border-yellow-700">
                  SIMULATED
                </span>
              )}
            </div>
            <div className="text-xs font-bold leading-tight" style={{ color: typeColor, textShadow: `0 0 8px ${typeColor}` }}>
              {event.title}
            </div>
            <div className="text-xs text-green-400 mt-0.5 leading-tight">{event.subtitle}</div>
          </div>
          <button
            onClick={onClose}
            className="text-green-700 hover:text-green-300 text-lg leading-none flex-shrink-0 mt-0.5"
          >
            ×
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {/* Meta row */}
          <div className="flex items-center gap-3 flex-wrap">
            <MetaPill label="DATE" value={event.date} />
            <MetaPill label="ACTOR" value={event.country} color={countryColor} />
            <MetaPill label="TYPE" value={event.type.toUpperCase()} />
          </div>

          {/* Description */}
          <div className="text-xs text-green-300 leading-relaxed">
            {event.description}
          </div>

          {/* Locations */}
          <div>
            <FieldLabel>ORIGIN</FieldLabel>
            <div className="text-xs text-green-400 ml-2">{event.origin?.label}</div>
            <FieldLabel>TARGET(S)</FieldLabel>
            <div className="ml-2 space-y-0.5">
              {event.targets?.map((t, i) => (
                <div key={t.label} className="text-xs text-green-400">↳ {t.label}</div>
              ))}
            </div>
          </div>

          {/* Casualties */}
          {event.casualties && (
            <div>
              <FieldLabel>CASUALTIES</FieldLabel>
              <div className="text-xs ml-2" style={{ color: event.casualties.includes('killed') || event.casualties.includes('KIA') ? '#ff6666' : '#00ff88' }}>
                {event.casualties}
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-1">
            {event.tags?.map((tag) => (
              <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-green-950 text-green-600 border border-green-900">
                {tag}
              </span>
            ))}
          </div>

          {/* Source */}
          <div className="text-xs text-green-700">
            <span className="text-green-600">SOURCE: </span>{event.source}
          </div>
        </div>

        {/* Footer — Watch Video */}
        <div
          className="p-3"
          style={{ borderTop: `1px solid ${typeColor}22` }}
        >
          <button
            onClick={onWatchVideo}
            className="w-full py-2 rounded text-xs font-bold tracking-widest flex items-center justify-center gap-2 transition-all hover:brightness-110"
            style={{
              background: `${typeColor}22`,
              border: `1px solid ${typeColor}55`,
              color: typeColor,
              textShadow: `0 0 8px ${typeColor}`,
              boxShadow: `0 0 10px ${typeColor}11`,
            }}
          >
            ▶ WATCH VIDEO FOOTAGE
          </button>
        </div>
      </div>
    </div>
  )
}

function MetaPill({ label, value, color }) {
  return (
    <div className="flex flex-col">
      <span className="text-green-700 text-xs">{label}</span>
      <span className="text-xs font-bold" style={{ color: color || '#00ff41' }}>
        {value}
      </span>
    </div>
  )
}

function FieldLabel({ children }) {
  return <div className="text-green-700 text-xs tracking-widest mt-1">{children}</div>
}
