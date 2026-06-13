'use client'
import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  label?: string
  className?: string
}

interface State {
  error: Error | null
}

export class WidgetBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  reset = () => this.setState({ error: null })

  render() {
    if (this.state.error) {
      return (
        <WidgetFallback
          label={this.props.label}
          className={this.props.className}
          onRetry={this.reset}
        />
      )
    }
    return this.props.children
  }
}

function WidgetFallback({
  label,
  className = '',
  onRetry,
}: {
  label?: string
  className?: string
  onRetry: () => void
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 py-10 text-center ${className}`}
    >
      <AlertTriangle className="h-6 w-6 text-zinc-600" />
      <div className="space-y-0.5">
        <p className="text-sm font-medium text-zinc-400">
          {label ? `${label} unavailable` : 'Widget unavailable'}
        </p>
        <p className="text-xs text-zinc-600">This section failed to load</p>
      </div>
      <button
        onClick={onRetry}
        className="flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors"
      >
        <RefreshCw className="h-3 w-3" />
        Retry
      </button>
    </div>
  )
}
