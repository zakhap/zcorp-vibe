'use client';

import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  errorInfo?: React.ErrorInfo;
}

// Default error fallback component
function DefaultErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="min-h-[400px] flex items-center justify-center bg-red-50 rounded-lg border border-red-200">
      <div className="text-center p-8 max-w-md">
        <div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
          <span className="text-red-600 text-2xl">⚠️</span>
        </div>
        <h2 className="text-xl font-semibold text-red-900 mb-2">
          Something went wrong
        </h2>
        <p className="text-red-700 mb-4">
          An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
        </p>
        <div className="space-x-3">
          <button
            onClick={resetError}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4 text-left">
            <summary className="text-sm text-red-600 cursor-pointer">
              Technical Details (Development)
            </summary>
            <pre className="mt-2 text-xs text-red-800 bg-red-100 p-2 rounded overflow-auto">
              {error.message}
              {error.stack && (
                <>
                  {'\n\nStack Trace:\n'}
                  {error.stack}
                </>
              )}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Report to error tracking service (if available)
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
      });
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return (
        <FallbackComponent
          error={this.state.error}
          resetError={this.resetError}
          errorInfo={this.state.errorInfo}
        />
      );
    }

    return this.props.children;
  }
}

// Specific error boundary for wallet operations
export function WalletErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
      <div className="flex items-center mb-4">
        <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
          <span className="text-yellow-600">🔗</span>
        </div>
        <h3 className="text-lg font-semibold text-yellow-900">
          Wallet Connection Error
        </h3>
      </div>
      <p className="text-yellow-800 mb-4">
        There was an issue connecting to your wallet. This might be due to:
      </p>
      <ul className="list-disc list-inside text-yellow-800 mb-4 space-y-1">
        <li>Wallet extension not installed or enabled</li>
        <li>Network connectivity issues</li>
        <li>Wallet is locked or disconnected</li>
        <li>Unsupported wallet or browser</li>
      </ul>
      <div className="space-x-3">
        <button
          onClick={resetError}
          className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
        >
          Retry Connection
        </button>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Refresh Page
        </button>
      </div>
    </div>
  );
}

// HOC for wrapping components with error boundaries
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: React.ComponentType<ErrorFallbackProps>,
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
) {
  const ComponentWithErrorBoundary = (props: P) => (
    <ErrorBoundary fallback={fallback} onError={onError}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  ComponentWithErrorBoundary.displayName = `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;

  return ComponentWithErrorBoundary;
}

export default ErrorBoundary;