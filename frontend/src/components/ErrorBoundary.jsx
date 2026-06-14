import { Component } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('Render error caught by boundary:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-5 px-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-accent/15 flex items-center justify-center">
            <AlertTriangle size={30} className="text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Something went wrong</h1>
            <p className="text-muted text-sm mt-2 max-w-md">
              An unexpected error occurred while rendering this page. You can try again or head back home.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={this.handleReset}
              className="gradient-accent text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 transition flex items-center gap-2"
            >
              <RotateCcw size={16} /> Try Again
            </button>
            <a
              href="/"
              className="glass text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/10 transition"
            >
              Go Home
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
