'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import {
  Home,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console (can integrate with error tracking service)
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-orange-500/5"></div>

      <div className="relative text-center max-w-md">
        {/* Error Icon */}
        <div className="mb-8 flex justify-center">
          <div className="p-6 bg-red-500/10 rounded-full">
            <AlertTriangle className="w-16 h-16 text-red-500" />
          </div>
        </div>

        {/* Message */}
        <h1 className="text-2xl font-bold text-foreground mb-3">
          Something Went Wrong
        </h1>
        <p className="text-muted-foreground mb-4">
          We encountered an unexpected error. Don't worry,
          our team has been notified and is working on a
          fix.
        </p>

        {/* Error Details (only in development) */}
        {process.env.NODE_ENV === 'development' &&
          error.message && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-left">
              <p className="text-xs font-mono text-red-400 break-all">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-xs text-muted-foreground mt-2">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-muted text-foreground rounded-xl font-medium hover:bg-muted/80 transition-colors"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
        </div>

        {/* Decorative elements */}
        <div className="mt-16 flex justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500/50 animate-pulse"></div>
          <div className="w-2 h-2 rounded-full bg-red-500/30 animate-pulse delay-100"></div>
          <div className="w-2 h-2 rounded-full bg-red-500/20 animate-pulse delay-200"></div>
        </div>
      </div>
    </div>
  );
}
