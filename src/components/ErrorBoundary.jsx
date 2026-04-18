import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-black">
          <div className="text-center mil-panel border-glow p-8 rounded max-w-md">
            <div className="text-red-400 glow-red text-lg font-bold tracking-widest mb-2">
              GLOBE RENDER FAILURE
            </div>
            <div className="text-green-700 text-xs mb-4">
              {this.state.error?.message ?? 'Unknown WebGL error'}
            </div>
            <button
              onClick={() => this.setState({ error: null })}
              className="text-xs px-4 py-2 border border-green-800 text-green-500 rounded hover:border-green-500 transition-colors"
            >
              RETRY
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
