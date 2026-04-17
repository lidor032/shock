import { useState } from 'react'
import { format } from 'date-fns'

export default function Header({ mode, onModeChange }) {
  return (
    <div className="absolute top-0 left-0 right-0 z-30 flex items-stretch pointer-events-none">
      {/* Left block — title */}
      <div className="mil-panel border-glow px-4 py-2 flex items-center gap-3 pointer-events-auto">
        <div className="flex flex-col">
          <span className="text-xs text-green-600 tracking-widest uppercase">OSINT Theater Map</span>
          <span className="text-sm glow font-bold tracking-wider">IL / IR / US CONFLICT</span>
        </div>
        <div className="w-px h-8 bg-green-800 mx-1" />
        <div className="flex flex-col text-xs">
          <span className="text-green-500">{format(new Date(), 'dd MMM yyyy')}</span>
          <LiveClock />
        </div>
      </div>

      {/* Center — mode toggle */}
      <div className="flex-1 flex justify-center items-center pointer-events-auto">
        <div className="mil-panel border-glow flex rounded overflow-hidden">
          <ModeBtn active={mode === 'live'} onClick={() => onModeChange('live')} color="red">
            <span className={`inline-block w-2 h-2 rounded-full mr-2 ${mode === 'live' ? 'bg-red-500 animate-pulse' : 'bg-red-900'}`} />
            LIVE
          </ModeBtn>
          <ModeBtn active={mode === 'timeline'} onClick={() => onModeChange('timeline')} color="green">
            ⏱ TIMELINE
          </ModeBtn>
        </div>
      </div>

      {/* Right block — status chips */}
      <div className="mil-panel border-glow px-4 py-2 flex items-center gap-4 pointer-events-auto">
        <StatusChip label="IRAN THREAT" value="CRITICAL" color="red" />
        <StatusChip label="ACTIVE OPS" value="3" color="amber" />
        <StatusChip label="US CARRIERS" value="2" color="blue" />
      </div>
    </div>
  )
}

function ModeBtn({ active, onClick, children, color }) {
  const activeClass =
    color === 'red'
      ? 'bg-red-950 text-red-400 border-b-2 border-red-500 glow-red'
      : 'bg-green-950 text-green-400 border-b-2 border-green-500 glow'

  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-xs font-bold tracking-widest transition-all ${
        active ? activeClass : 'text-green-800 hover:text-green-500'
      }`}
    >
      {children}
    </button>
  )
}

function StatusChip({ label, value, color }) {
  const colors = {
    red:   'text-red-400 glow-red',
    amber: 'text-yellow-400 glow-amber',
    blue:  'text-blue-400 glow-blue',
    green: 'text-green-400 glow',
  }
  return (
    <div className="flex flex-col items-center">
      <span className="text-green-700 text-xs tracking-widest">{label}</span>
      <span className={`text-sm font-bold ${colors[color] ?? colors.green}`}>{value}</span>
    </div>
  )
}

function LiveClock() {
  const [time, setTime] = useState(new Date())

  useState(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  })

  return (
    <span className="text-green-400 glow font-bold tabular-nums">
      {format(time, 'HH:mm:ss')} UTC
    </span>
  )
}
