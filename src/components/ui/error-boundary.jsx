import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { captureException } from '@/lib/sentry';
import { cn } from '@/lib/utils';
import { stb } from '@/lib/stbUi';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(_error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    captureException(error, { componentStack: errorInfo?.componentStack });
    this.setState({ error, errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="stb-page flex items-center justify-center p-4">
          <div className={cn('max-w-md w-full p-8 text-center', stb.panel)}>
            <div className={cn(stb.iconBox, 'w-16 h-16 mx-auto mb-6 border-destructive/30 bg-destructive/10 text-destructive')}>
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h1 className={cn(stb.title, 'text-2xl mb-2')}>Something went wrong</h1>
            <p className={cn(stb.body, 'mb-8')}>
              We encountered an unexpected error. Our team has been notified.
            </p>

            <div className="space-y-3">
              <Button onClick={this.handleReload} className="w-full h-12">
                <RefreshCcw className="w-4 h-4 mr-2" />
                Reload Page
              </Button>

              <Button
                variant="ghost"
                onClick={() => (window.location.href = '/')}
                className="w-full"
              >
                Go to homepage
              </Button>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <pre className="mt-6 text-left text-xs bg-muted p-4 overflow-auto max-h-40 border border-foreground/15">
                {this.state.error.toString()}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
