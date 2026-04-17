import { format } from 'date-fns'
import { TIMELINE_START, TIMELINE_END } from '../data/events'
import { getTypeColor, getImportanceColor } from '../utils/colors'

const TOTAL = TIMELINE_END - TIMELINE_START

export default function Timeline({
  events,
  currentTime,
  isPlaying,
  speed,
  onTimeChange,
  onPlayPause,
  onSpeedChange,
  onEventClick,
}) {
  const progress = (currentTime - TIMELINE_START) / TOTAL

  const handleScrub = (e) => {
    const ratio = parseFloat(e.target.value) / 1000
    onTimeChange(TIMELINE_START + ratio * TOTAL)
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 z-30">
      <div className="mil-panel border-glow">
        {/* Event dots row */}
        <div className="relative h-5 mx-4 mt-2">
          {events.map((ev) => {
            const pct = ((ev.timestamp - TIMELINE_START) / TOTAL) * 100
            const isActive = ev.timestamp <= currentTime && ev.timestamp >= currentTime - 12 * 3600_000
            const color = getImportanceColor(ev.importance)
            return (
              <button
                key={ev.id}
                onClick={() => onEventClick(ev)}
                title={ev.title}
                className="absolute -translate-x-1/2 transition-all hover:scale-150"
                style={{ left: `${pct}%`, bottom: 0 }}
              >
                <span
                  className="block rounded-full"
                  style={{
                    width:  ev.importance === 'critical' ? 8 : 5,
                    height: ev.importance === 'critical' ? 8 : 5,
                    background: isActive ? color : `${color}55`,
                    boxShadow: isActive ? `0 0 6px ${color}` : 'none',
                  }}
                />
              </button>
            )
          })}
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
            value={Math.round(progress * 1000)}
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

          {/* Date range labels */}
          <div className="flex items-center gap-4 text-green-800 text-xs">
            <span>{format(TIMELINE_START, 'MMM yyyy')}</span>
            <span>──</span>
            <span>{format(TIMELINE_END, 'MMM yyyy')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
