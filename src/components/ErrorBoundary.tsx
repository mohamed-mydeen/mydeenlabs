import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || 'An unexpected rendering error occurred.',
    };
  }

  handleReset = () => {
    this.setState({ hasError: false, message: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[320px] flex items-center justify-center p-6">
          <div className="w-full max-w-md hybrid-panel rounded-2xl p-6 text-center space-y-4">
            <div className="w-11 h-11 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto">
              <AlertTriangle size={20} className="text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-display">Something went wrong</h2>
              <p className="text-xs opacity-70 mt-1">
                {this.state.message}
              </p>
            </div>
            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#181818] text-[#E8D2B5] dark:bg-[#E8D2B5] dark:text-[#181818] text-xs font-semibold cursor-pointer"
            >
              <RefreshCw size={13} />
              <span>Reload View</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
