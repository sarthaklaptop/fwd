'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Mail, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const { error } =
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      });

    setLoading(false);

    if (error) {
      toast.error(
        error.message || 'Failed to send reset email'
      );
    } else {
      setSuccess(true);
      toast.success('Reset link sent!');
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-primary/5"></div>
        <div className="relative bg-card/80 backdrop-blur-xl border border-border p-8 rounded-2xl shadow-2xl w-full max-w-md text-center">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Check your email
          </h1>
          <p className="text-muted-foreground">
            We&apos;ve sent a password reset link to{' '}
            <span className="text-foreground font-medium">
              {email}
            </span>
          </p>
          <p className="text-muted-foreground text-sm mt-4">
            Didn&apos;t receive the email? Check your spam
            folder or{' '}
            <button
              onClick={() => setSuccess(false)}
              className="text-primary hover:text-primary/80 transition-colors font-medium"
            >
              try again
            </button>
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 mt-6 text-primary hover:text-primary/80 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-primary/5"></div>

      <div className="relative bg-card/80 backdrop-blur-xl border border-border p-8 rounded-2xl shadow-2xl w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Link href="/" className="text-3xl font-bold">
            <span className="gradient-text">FWD</span>
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-2 text-center">
          Forgot password?
        </h1>
        <p className="text-muted-foreground text-sm text-center mb-6">
          Enter your email and we&apos;ll send you a reset
          link
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
              placeholder="you@example.com"
              required
            />
          </div>

          <Button
            type="submit"
            isLoading={loading}
            className="w-full py-6 text-base font-semibold rounded-xl shadow-lg shadow-primary/20"
          >
            {loading ? 'Sending...' : 'Send reset link'}
          </Button>
        </form>

        <p className="mt-6 text-center text-muted-foreground text-sm">
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-1 text-primary hover:text-primary/80 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
