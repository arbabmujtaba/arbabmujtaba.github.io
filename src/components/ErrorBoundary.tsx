import React from 'react';

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<{}, State> {
  constructor(props: {}) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: any) {
    // Forward to local server logging in dev mode if available
    if (typeof fetch !== 'undefined') {
      try {
        fetch('/__client-error', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: error.message, stack: (error as any).stack, info })
        }).catch(() => {});
      } catch {}
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="p-8 text-center text-zinc-200">
          <h2 className="font-serif text-2xl">An unexpected error occurred</h2>
          <p className="mt-4 text-sm text-zinc-400">Check the dev console or server logs for details.</p>
          <pre className="mt-6 text-xs text-left max-w-3xl mx-auto bg-black/40 p-4 rounded">{String(this.state.error.stack || this.state.error.message)}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
