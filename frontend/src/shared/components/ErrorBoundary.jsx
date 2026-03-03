import { Component } from 'react'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      message: '',
    }
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message || 'Unexpected UI error.',
    }
  }

  componentDidCatch(error) {
    if (import.meta.env.DEV) {
      // Keep console trace in development to debug rendering problems.
      console.error(error)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="card">
          <h2>Something went wrong</h2>
          <p className="error">{this.state.message}</p>
          <button type="button" onClick={() => window.location.reload()}>
            Reload app
          </button>
        </section>
      )
    }

    return this.props.children
  }
}
