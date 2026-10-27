import { Component } from 'react'

// Isolates a subtree so a failure there (e.g. the lazy 3D chunk failing to load)
// renders a fallback instead of blanking the whole app.
export default class ErrorBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error) {
    if (import.meta.env.DEV) console.error('ErrorBoundary caught:', error)
  }

  render() {
    if (this.state.failed) return this.props.fallback ?? null
    return this.props.children
  }
}
