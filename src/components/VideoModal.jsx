import { useEffect } from 'react'
import { getTypeColor } from '../utils/colors'

export default function VideoModal({ event, onClose }) {
  // Must be called unconditionally (Rules of Hooks)
  useEffect(() => {
    if (!event) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [event, onClose])

  if (!event) return null

  const typeColor   = getTypeColor(event.type)
  const searchQuery = encodeURIComponent(event.searchQuery ?? event.title)
  const ytSearchUrl = `https://www.youtube.com/results?search_query=${searchQuery}`

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center fade-in"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="mil-panel rounded-lg flex flex-col overflow-hidden"
        style={{
          width: 'min(860px, 96vw)',
          maxHeight: '90vh',
          border: `1px solid ${typeColor}55`,
          boxShadow: `0 0 40px ${typeColor}22`,
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 flex-shrink-0"
          style={{ borderBottom: `1px solid ${typeColor}33` }}
        >
          <div>
            <div className="text-xs tracking-widest text-green-600">VIDEO INTELLIGENCE</div>
            <div className="text-sm font-bold" style={{ color: typeColor }}>
              {event.title}
            </div>
            <div className="text-xs text-green-400">{event.subtitle}</div>
          </div>
          <button
            onClick={onClose}
            className="text-green-600 hover:text-green-200 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* YouTube search CTA */}
        <div
          className="flex-1 flex flex-col items-center justify-center gap-6 px-8 py-12"
          style={{ minHeight: 260 }}
        >
          <div className="text-center">
            <div className="text-green-700 text-xs tracking-widest mb-2">OPEN SOURCE FOOTAGE</div>
            <div className="text-green-400 text-sm max-w-md leading-relaxed">
              {event.description?.slice(0, 140)}…
            </div>
          </div>
          <a
            href={ytSearchUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 px-6 py-3 rounded border transition-all"
            style={{
              borderColor: `${typeColor}88`,
              color: typeColor,
              background: `${typeColor}11`,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.7 15.5V8.5l6.3 3.5-6.3 3.5z"/>
            </svg>
            <span className="text-sm font-bold tracking-wider">Search on YouTube ↗</span>
          </a>
          <div className="text-green-800 text-xs">
            Query: {event.searchQuery ?? event.title}
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-4 py-2 flex items-center justify-between text-xs text-green-700 flex-shrink-0"
          style={{ borderTop: `1px solid ${typeColor}22` }}
        >
          <span>SOURCE: {event.source}</span>
          <span>{event.date} · {event.country}</span>
          {event.simulated && (
            <span className="text-yellow-600 font-bold">⚠ SIMULATED EVENT</span>
          )}
        </div>
      </div>
    </div>
  )
}
