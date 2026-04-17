import { useEffect } from 'react'
import { getTypeColor } from '../utils/colors'

export default function VideoModal({ event, onClose }) {
  if (!event) return null

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const typeColor   = getTypeColor(event.type)
  // YouTube search embed — shows search results for the event inside the player
  const searchQuery = encodeURIComponent(event.searchQuery ?? event.title)
  const embedSrc    = `https://www.youtube.com/embed?listType=search&list=${searchQuery}&autoplay=1`
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

        {/* YouTube Embed */}
        <div className="relative w-full flex-1 min-h-0" style={{ aspectRatio: '16/9', minHeight: 320 }}>
          <iframe
            key={event.id}
            src={embedSrc}
            title={event.title}
            allowFullScreen
            allow="autoplay; encrypted-media"
            className="absolute inset-0 w-full h-full"
            style={{ border: 'none', background: '#000' }}
          />
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
