import { useState } from 'react'
import { format } from 'date-fns'
import { getImportanceColor } from '../utils/colors'

export default function Timeline({
  events,
  currentTime,
  isPlaying,
  speed,
  startTime,
  endTime,
  onTimeChange,
  onPlayPause,
  onSpeedChange,
  onEventClick,
}) {
  const [hoveredEvent, setHoveredEvent] = useState(null)

  const totalDuration  = endTime - startTime
  const progress       = totalDuration > 0 ? Math.max(0, Math.min(1, (currentTime - startTime) / totalDuration)) : 0
  const sliderValue    = Math.round(progress * 1000)

  const handleScrub = (e) => {
    onTimeChange(startTime + (Number(e.target.value) / 1000) * totalDuration)
  }

  // Only show events within the active campaign window
  const visibleEvents = events.filter((ev) => ev.timestamp >= startTime && ev.timestamp <= endTime)

  return (
    <div className="absolute bottom-0 left-0 right-0 z-30">
      <div className="mil-panel border-glow">
        {/* Event dots row */}
        <div className="relative h-5 mx-4 mt-2">
          {visibleEvents.map((ev) => {
            const pct      = ((ev.timestamp - startTime) / totalDuration) * 100
            const isActive = ev.timestamp <= currentTime && ev.timestamp >= currentTime - 12 * 3600_000
            const color    = getImportanceColor(ev.importance)
            return (
              <button
                key={ev.id}
                onClick={() => { onTimeChange(ev.timestamp); onEventClick(ev) }}
                className="absolute -translate-x-1/2 transition-all hover:scale-150"
                style={{ left: `${pct}%`, bottom: 0 }}
                onMouseEnter={() => setHoveredEvent({ ev, left: pct })}
                onMouseLeave={() => setHoveredEvent(null)}
              >
                <span
                  className="block rounded-full"
                  style={{
                    width:     ev.importance === 'critical' ? 8 : 5,
                    height:    ev.importance === 'critical' ? 8 : 5,
                    background: isActive ? color : `${color}55`,
                    boxShadow:  isActive ? `0 0 6px ${color}` : 'none',
                  }}
                />
              </button>
            )
          })}

          {/* HUD tooltip for hovered event dot */}
          {hoveredEvent && (
            <div
              className="absolute bottom-full mb-2 -translate-x-1/2 mil-panel border-glow px-2 py-1 pointer-events-none z-50 whitespace-nowrap"
              style={{ left: `${hoveredEvent.left}%` }}
            >
              <div className="text-green-400 text-xs font-bold font-mono">{hoveredEvent.ev.title}</div>
              <div className="text-green-700 text-xs font-mono">
                {format(new Date(hoveredEvent.ev.timestamp), 'dd MMM yyyy HH:mm')}
              </div>
            </div>
          )}

          {/* Playhead */}
          <div
            className="absolute bottom-0 top-0 w-px bg-green-400 pointer-events-none"
            style={{ left: `${progress * 100}%`, boxShadow: '0 0 6px #00ff41' }}
          />
        </div>

        {/* Scrubber */}
        <div className="px-4 py-1">
          <input
            type="range"
            min={0}
            max={1000}
            value={sliderValue}
            onChange={handleScrub}
            className="w-full"
          />
        </div>

        {/* Controls row */}
        <div className="px-4 pb-3 flex items-center gap-4">
          {/* Play/Pause */}
          <button
            onClick={onPlayPause}
            className="text-green-400 glow text-lg w-7 h-7 flex items-center justify-center border border-green-800 rounded hover:border-green-400"
          >
            {isPlaying ? '⏸' : '▶'}
          </button>

          {/* Speed */}
          <div className="flex items-center gap-1">
            {[1, 5, 20, 100].map((s) => (
              <button
                key={s}
                onClick={() => onSpeedChange(s)}
                className={`text-xs px-2 py-0.5 rounded border transition-all ${
                  speed === s
                    ? 'border-green-500 text-green-300 bg-green-950'
                    : 'border-green-900 text-green-700 hover:border-green-700'
                }`}
              >
                {s}×
              </button>
            ))}
          </div>

          {/* Current date display */}
          <div className="flex-1 text-center">
            <span className="text-green-500 text-sm glow tabular-nums font-bold">
              {format(new Date(currentTime), 'dd MMM yyyy HH:mm')} UTC
            </span>
          </div>

          {/* Campaign date range labels */}
          <div className="flex items-center gap-4 text-green-800 text-xs">
            <span>{format(new Date(startTime), 'dd MMM yyyy')}</span>
            <span>──</span>
            <span>{format(new Date(endTime), 'dd MMM yyyy')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
