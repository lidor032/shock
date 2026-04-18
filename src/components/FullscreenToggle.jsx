import { useState, useEffect, useCallback } from 'react'

export default function FullscreenToggle() {
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Keep state in sync with actual fullscreen status (e.g. user presses Esc)
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  const toggle = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }, [])

  // 'F' key shortcut — global, not tied to globe focus
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'f' || e.key === 'F') {
        // Don't trigger if user is typing in an input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return
        toggle()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [toggle])

  return (
    <button
      onClick={toggle}
      className="fullscreen-toggle"
      style={{ bottom: '20px', left: '20px', right: 'auto' }}
      title={isFullscreen ? 'Exit fullscreen [F]' : 'Enter fullscreen [F]'}
      aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
    >
      {isFullscreen ? '⛶ COMPRESS' : '⛶ EXPAND'}
    </button>
  )
}
