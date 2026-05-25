import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-bg px-6 text-center">
          <h1 className="text-xl font-bold text-primary">RescueNet failed to load</h1>
          <p className="mt-2 max-w-md text-sm text-muted">{this.state.error.message}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rn-btn-primary mt-6"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
