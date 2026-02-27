/**
 * ErrorBoundary — catches React render errors and shows a friendly fallback UI
 * instead of a blank white screen.
 */
import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
          <div className="max-w-md w-full text-center">
            <div className="text-6xl mb-4">💥</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Something went wrong
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              An unexpected error occurred. Don't worry — your data is safe.
            </p>
            {this.state.error && (
              <pre className="text-xs text-left bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl mb-6 overflow-x-auto max-h-32">
                {this.state.error.message || String(this.state.error)}
              </pre>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                🔄 Reload Page
              </button>
              <button
                onClick={this.handleReset}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-indigo-600 hover:shadow-lg transition-all"
              >
                🏠 Go Home
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
