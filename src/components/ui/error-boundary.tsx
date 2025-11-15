
'use client';

import React from 'react';
import { Logo } from '@/components/logo';
import { Button } from './button';
import { FirestorePermissionError } from '@/firebase/errors';
import { PermissionDenied } from './permission-denied';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Specifically handle FirestorePermissionError by showing the PermissionDenied component
      if (this.state.error instanceof FirestorePermissionError) {
        return <PermissionDenied />;
      }
      
      // Generic fallback UI for all other types of errors
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 text-center">
            <Logo className="w-40 mb-8" />
            <h1 className="text-3xl font-bold font-headline text-destructive mb-4">Oops! Something went wrong.</h1>
            <p className="text-muted-foreground mb-6 max-w-md">
                We've encountered an unexpected error. Please try refreshing the page, or contact support if the problem persists.
            </p>
            <Button onClick={() => this.setState({ hasError: false, error: null })}>
                Try again
            </Button>
             {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mt-8 p-4 bg-muted rounded-md text-left max-w-2xl overflow-auto">
                    <h3 className="font-bold text-lg mb-2">Error Details (Development Mode)</h3>
                    <pre className="text-sm text-destructive whitespace-pre-wrap">
                    <code>{this.state.error.stack}</code>
                    </pre>
                </div>
            )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
