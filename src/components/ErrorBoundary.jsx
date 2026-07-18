import React from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-bg-primary)] p-6 text-center fade-in">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex flex-col items-center justify-center mb-6">
            <AlertTriangle className="text-red-500" size={32} />
          </div>
          
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">Something went wrong</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mb-8 max-w-sm">
            {this.state.error?.message || "An unexpected error occurred while rendering this page."}
          </p>

          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button 
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-dark)] text-white font-medium hover:opacity-90 transition-opacity"
            >
              <RefreshCw size={18} />
              Reload Page
            </button>
            
            <button 
              onClick={() => window.location.href = '/'}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] font-medium hover:bg-[var(--color-bg-card-hover)] transition-colors border border-[var(--color-glass-border)]"
            >
              <Home size={18} />
              Go to Home
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
