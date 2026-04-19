import { useEffect } from 'react'
import { getTypeColor, getTypeIcon } from '../utils/colors'

export default function VideoModal({ event, onClose }) {
  const typeColor   = getTypeColor(event?.type)
  const searchQuery = encodeURIComponent(event?.searchQuery ?? event?.title ?? '')
  const ytSearchUrl = `https://www.youtube.com/results?search_query=${searchQuery}`

  // Close on Escape key
  useEffect(() => {
    if (!event) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, event])

  if (!event) return null

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
              {getTypeIcon(event.type)} {event.title}
            </div>
            <div className="text-xs text-green-400">{event.subtitle}</div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={ytSearchUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-green-600 hover:text-green-300 underline"
            >
              Open in YouTube ↗
            </a>
            <button
              onClick={onClose}
              className="text-green-600 hover:text-green-200 text-2xl leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {/* Video Search CTA */}
        <div className="flex flex-col items-center justify-center py-16 px-8 gap-6" style={{ minHeight: 280 }}>
          <div className="text-green-700 text-xs tracking-widest">OPEN-SOURCE FOOTAGE</div>
          <a
            href={ytSearchUrl}
            target="_blank"
            rel="noreferrer"
            className="px-8 py-4 rounded font-bold text-sm tracking-widest transition-all hover:scale-105"
            style={{
              background: `${typeColor}22`,
              border: `1px solid ${typeColor}66`,
              color: typeColor,
              boxShadow: `0 0 20px ${typeColor}33`,
              textShadow: `0 0 8px ${typeColor}`,
            }}
          >
            SEARCH YOUTUBE FOR FOOTAGE ↗
          </a>
          <div className="text-green-800 text-xs text-center max-w-md">
            {event.description}
          </div>
          {event.simulated && (
            <div className="text-yellow-600 text-xs font-bold tracking-widest">
              SIMULATED EVENT — NO REAL FOOTAGE
            </div>
          )}
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
