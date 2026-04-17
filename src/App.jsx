import { useState, useCallback } from 'react'
import Globe3D from './components/Globe3D'
import Timeline from './components/Timeline'
import EventCard from './components/EventCard'
import VideoModal from './components/VideoModal'
import NewsFeed from './components/NewsFeed'
import Legend from './components/Legend'
import Header from './components/Header'
import { events, TIMELINE_START } from './data/events'
import { useSimulation } from './hooks/useSimulation'
import { useNews } from './hooks/useNews'

export default function App() {
  const [mode, setMode]               = useState('live')           // 'live' | 'timeline'
  const [selectedEvent, setSelected]  = useState(null)
  const [showVideo, setShowVideo]     = useState(false)
  const [currentTime, setCurrentTime] = useState(TIMELINE_START)
  const [isPlaying, setIsPlaying]     = useState(true)
  const [speed, setSpeed]             = useState(5)

  const { activeEvents } = useSimulation({
    mode, currentTime, isPlaying, speed, events, setCurrentTime,
  })

  const { headlines } = useNews()

  const handleEventClick = useCallback((event) => {
    setSelected(event)
    setShowVideo(false)
  }, [])

  const handleWatchVideo = useCallback(() => {
    setShowVideo(true)
  }, [])

  const handleCloseCard = useCallback(() => {
    setSelected(null)
    setShowVideo(false)
  }, [])

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden">
      {/* Full-screen Globe (behind everything) */}
      <div className="absolute inset-0 z-0">
        <Globe3D
          events={events}
          activeEvents={activeEvents}
          selectedEvent={selectedEvent}
          onEventClick={handleEventClick}
        />
      </div>

      {/* News ticker (below header) */}
      <NewsFeed headlines={headlines} />

      {/* Top header */}
      <Header mode={mode} onModeChange={(m) => { setMode(m); setSelected(null) }} />

      {/* Right-side event card */}
      {selectedEvent && !showVideo && (
        <EventCard
          event={selectedEvent}
          onClose={handleCloseCard}
          onWatchVideo={handleWatchVideo}
        />
      )}

      {/* Video modal */}
      {showVideo && selectedEvent && (
        <VideoModal
          event={selectedEvent}
          onClose={() => setShowVideo(false)}
        />
      )}

      {/* Bottom-left legend */}
      <Legend />

      {/* Event count badge (live mode) */}
      {mode === 'live' && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 fade-in">
          <div className="mil-panel border-glow px-4 py-2 text-center">
            <div className="text-green-700 text-xs tracking-widest">ACTIVE OPERATIONS</div>
            <div className="text-green-400 glow font-bold text-sm">
              {activeEvents.length} arc{activeEvents.length !== 1 ? 's' : ''} tracked
            </div>
            <div className="text-green-800 text-xs mt-0.5">Click any arc or marker for details</div>
          </div>
        </div>
      )}

      {/* Timeline (only in timeline mode) */}
      {mode === 'timeline' && (
        <Timeline
          events={events}
          currentTime={currentTime}
          isPlaying={isPlaying}
          speed={speed}
          onTimeChange={setCurrentTime}
          onPlayPause={() => setIsPlaying((p) => !p)}
          onSpeedChange={setSpeed}
          onEventClick={handleEventClick}
        />
      )}

      {/* Corner decoration */}
      <div className="absolute bottom-4 left-4 z-20 text-green-900 text-xs pointer-events-none select-none">
        <div>◈ DATA: OSINT / PUBLIC REPORTING</div>
        <div>◈ SIMULATED EVENTS MARKED ◈</div>
      </div>
    </div>
  )
}
