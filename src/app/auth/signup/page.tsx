'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });

    if (error) {
      toast.error(error.message || 'Failed to create account');
      setLoading(false);
      return;
    }

    if (data.user) {
      try {
        await fetch('/api/auth/create-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: data.user.id,
            email: data.user.email,
            name,
          }),
        });
      } catch (err) {
        console.error('Error creating user record:', err);
      }

      toast.success('Account created!');

      if (data.user.identities?.length === 0) {
        setSuccess(true);
        setLoading(false);
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-primary/5"></div>
        <div className="relative bg-card/80 backdrop-blur-xl border border-border p-8 rounded-2xl shadow-2xl w-full max-w-md text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Check your email</h1>
          <p className="text-muted-foreground">
            We&apos;ve sent a verification link to{' '}
            <span className="text-foreground font-medium">{email}</span>
          </p>
          <Link
            href="/auth/login"
            className="inline-block mt-6 text-primary hover:text-primary/80 transition-colors font-medium"
          >
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-primary/5"></div>

      <div className="relative bg-card/80 backdrop-blur-xl border border-border p-8 rounded-2xl shadow-2xl w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Link href="/" className="text-3xl font-bold">
            <span className="gradient-text">FWD</span>
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-2 text-center">
          Create an account
        </h1>
        <p className="text-muted-foreground text-sm text-center mb-6">
          Start sending emails in minutes
        </p>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1.5">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
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

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
              placeholder="••••••••"
              minLength={6}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-muted-foreground text-sm">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-primary hover:text-primary/80 transition-colors font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
