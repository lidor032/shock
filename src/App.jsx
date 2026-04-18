import React, { useState, useCallback, useMemo } from 'react'
import Globe3D          from './components/Globe3D'
import Timeline         from './components/Timeline'
import EventCard        from './components/EventCard'
import VideoModal       from './components/VideoModal'
import NewsFeed         from './components/NewsFeed'
import Legend           from './components/Legend'
import Header           from './components/Header'
import FullscreenToggle from './components/FullscreenToggle'
import { events, campaigns } from './data/events'
import { useSimulation } from './hooks/useSimulation'
import { useNews }        from './hooks/useNews'

class GlobeErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() { return { hasError: true } }
  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <div className="text-center">
            <div className="text-red-500 text-lg font-bold tracking-widest">GLOBE UNAVAILABLE</div>
            <div className="text-green-700 text-xs mt-2">WebGL context lost — reload to recover</div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default function App() {
  const [mode, setMode]              = useState('live')
  const [selectedEvent, setSelected] = useState(null)
  const [showVideo, setShowVideo]    = useState(false)
  const [isPlaying, setIsPlaying]    = useState(true)
  const [speed, setSpeed]            = useState(1)

  // ── Campaign selector ──────────────────────────────────────────────────────
  const [activeCampaignId, setActiveCampaignId] = useState('all')

  const currentCampaign = useMemo(
    () => campaigns.find((c) => c.id === activeCampaignId) ?? campaigns[0],
    [activeCampaignId]
  )

  const [currentTime, setCurrentTime] = useState(currentCampaign.start)

  const handleCampaignChange = (e) => {
    const campaign = campaigns.find((c) => c.id === e.target.value) ?? campaigns[0]
    setActiveCampaignId(campaign.id)
    setCurrentTime(campaign.start)
    setSelected(null)
  }

  // ── Simulation ─────────────────────────────────────────────────────────────
  const { activeEvents } = useSimulation({
    mode,
    currentTime,
    isPlaying,
    speed,
    events,
    setCurrentTime,
    startTime: currentCampaign.start,
    endTime:   currentCampaign.end,
  })

  const { headlines, error: newsError } = useNews()

  // ── Event handlers ─────────────────────────────────────────────────────────
  const handleEventClick = useCallback((event) => {
    setSelected(event)
    setShowVideo(false)
  }, [])

  const handleWatchVideo = useCallback(() => setShowVideo(true), [])

  const handleCloseCard = useCallback(() => {
    setSelected(null)
    setShowVideo(false)
  }, [])

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden">
      {/* Full-screen Globe */}
      <div className="absolute inset-0 z-0">
        <GlobeErrorBoundary>
          <Globe3D
            events={events}
            activeEvents={activeEvents}
            selectedEvent={selectedEvent}
            onEventClick={handleEventClick}
          />
        </GlobeErrorBoundary>
      </div>

      <NewsFeed headlines={headlines} newsError={newsError} />

      <Header mode={mode} onModeChange={(m) => { setMode(m); setSelected(null) }} activeEvents={activeEvents} />

      {/* Campaign selector — visible in timeline mode */}
      {mode === 'timeline' && (
        <div className="absolute top-20 right-4 z-40 mil-panel border-glow p-2 rounded">
          <label className="text-green-700 text-xs mr-2 font-mono tracking-widest">FOCUS:</label>
          <select
            value={activeCampaignId}
            onChange={handleCampaignChange}
            className="bg-black text-green-400 border border-green-800 text-xs p-1 rounded font-mono outline-none hover:border-green-600 transition-colors"
          >
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}

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

      <Legend />

      <FullscreenToggle />

      {/* Active arc count badge (live mode) */}
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

      {/* Timeline panel */}
      {mode === 'timeline' && (
        <Timeline
          events={events}
          currentTime={currentTime}
          isPlaying={isPlaying}
          speed={speed}
          startTime={currentCampaign.start}
          endTime={currentCampaign.end}
          onTimeChange={setCurrentTime}
          onPlayPause={() => setIsPlaying((p) => !p)}
          onSpeedChange={setSpeed}
          onEventClick={handleEventClick}
        />
      )}

      <div className="absolute bottom-4 left-4 z-20 text-green-900 text-xs pointer-events-none select-none">
        <div>◈ DATA: OSINT / PUBLIC REPORTING</div>
        <div>◈ SIMULATED EVENTS MARKED ◈</div>
      </div>
    </div>
  )
}
