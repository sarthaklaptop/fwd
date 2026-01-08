'use client';

import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5"></div>

      <div className="relative text-center max-w-md">
        {/* 404 Number */}
        <div className="mb-8">
          <span className="text-[150px] font-bold leading-none gradient-text">
            404
          </span>
        </div>

        {/* Message */}
        <h1 className="text-2xl font-bold text-foreground mb-3">
          Page Not Found
        </h1>
        <p className="text-muted-foreground mb-8">
          Oops! The page you're looking for doesn't exist or
          has been moved.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
          <button
            onClick={() => history.back()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-muted text-foreground rounded-xl font-medium hover:bg-muted/80 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>

        {/* Decorative elements */}
        <div className="mt-16 flex justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary/50 animate-pulse"></div>
          <div className="w-2 h-2 rounded-full bg-primary/30 animate-pulse delay-100"></div>
          <div className="w-2 h-2 rounded-full bg-primary/20 animate-pulse delay-200"></div>
        </div>
      </div>
    </div>
  );
}
