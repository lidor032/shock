import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from '../App'

// Globe3D uses Three.js / WebGL — cannot run in jsdom
vi.mock('../components/Globe3D', () => ({
  default: () => <div data-testid="globe-mock" />,
}))

// Prevent real fetch calls from useNews
vi.mock('../hooks/useNews', () => ({
  useNews: () => ({ headlines: [], loading: false, error: null }),
}))

// ── App integration smoke tests ──────────────────────────────────────────────
describe('App integration', () => {
  it('renders without crashing', () => {
    // If this throws, the test fails automatically
    render(<App />)
    expect(screen.getByTestId('globe-mock')).toBeTruthy()
  })

  it('shows LIVE mode by default', () => {
    render(<App />)
    // The Header renders a mode-toggle with "LIVE" text in the active button.
    // Regardless of styling, the text "LIVE" should be present.
    expect(screen.getByText('LIVE')).toBeTruthy()
  })

  it('clicking TIMELINE mode shows the timeline panel', () => {
    render(<App />)
    // Click the TIMELINE button in the mode toggle
    fireEvent.click(screen.getByText(/TIMELINE/i))
    // The Timeline panel contains a range slider (scrubber)
    expect(document.querySelector('input[type="range"]')).toBeTruthy()
  })

  it('clicking LIVE mode hides the timeline panel', () => {
    render(<App />)
    // Switch to timeline first, then switch back to live
    fireEvent.click(screen.getByText(/TIMELINE/i))
    expect(document.querySelector('input[type="range"]')).toBeTruthy()

    fireEvent.click(screen.getByText('LIVE'))
    expect(document.querySelector('input[type="range"]')).toBeNull()
  })

  it('in LIVE mode shows ACTIVE OPERATIONS badge', () => {
    render(<App />)
    // App starts in live mode — the badge should be visible immediately
    expect(screen.getByText('ACTIVE OPERATIONS')).toBeTruthy()
  })
})
