'use client';

import { useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

// Password strength calculation
function calculatePasswordStrength(password: string) {
  const checks = {
    length: password.length >= 8,
    length12: password.length >= 12,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  let score = 0;
  if (checks.length) score++;
  if (checks.length12) score++;
  if (checks.lowercase) score++;
  if (checks.uppercase) score++;
  if (checks.number) score++;
  if (checks.special) score++;

  return { score, checks };
}

function getStrengthLabel(score: number): {
  label: string;
  color: string;
  bgColor: string;
} {
  if (score <= 1)
    return {
      label: 'Weak',
      color: 'text-red-500',
      bgColor: 'bg-red-500',
    };
  if (score <= 3)
    return {
      label: 'Fair',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500',
    };
  if (score <= 5)
    return {
      label: 'Good',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500',
    };
  return {
    label: 'Strong',
    color: 'text-green-500',
    bgColor: 'bg-green-500',
  };
}

function PasswordStrengthIndicator({
  password,
}: {
  password: string;
}) {
  const { score, checks } = useMemo(
    () => calculatePasswordStrength(password),
    [password],
  );
  const { label, color, bgColor } = getStrengthLabel(score);
  const percentage = (score / 6) * 100;

  const requirements = [
    {
      key: 'length',
      label: '8+ characters',
      met: checks.length,
    },
    {
      key: 'uppercase',
      label: 'Uppercase letter',
      met: checks.uppercase,
    },
    {
      key: 'lowercase',
      label: 'Lowercase letter',
      met: checks.lowercase,
    },
    { key: 'number', label: 'Number', met: checks.number },
    {
      key: 'special',
      label: 'Special character',
      met: checks.special,
    },
  ];

  return (
    <div className="mt-3 space-y-3">
      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">
            Password strength
          </span>
          <span className={`text-xs font-medium ${color}`}>
            {label}
          </span>
        </div>
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <div
            className={`h-full ${bgColor} transition-all duration-300 ease-out rounded-full`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Requirements checklist */}
      <div className="grid grid-cols-2 gap-1.5">
        {requirements.map((req) => (
          <div
            key={req.key}
            className={`flex items-center gap-1.5 text-xs ${
              req.met
                ? 'text-green-500'
                : 'text-muted-foreground'
            }`}
          >
            {req.met ? (
              <Check className="w-3 h-3" />
            ) : (
              <X className="w-3 h-3" />
            )}
            <span>{req.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

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
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      toast.error(
        error.message || 'Failed to create account',
      );
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

      // Check if email confirmation is required
      // identities?.length === 0 means user already exists (duplicate signup)
      // email_confirmed_at being null means confirmation is pending
      if (
        data.user.identities?.length === 0 ||
        !data.session
      ) {
        // Email confirmation required - show check email screen
        setSuccess(true);
        setLoading(false);
      } else {
        // User is immediately logged in (email auto-confirmed or already verified)
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
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Check your email
          </h1>
          <p className="text-muted-foreground">
            We&apos;ve sent a verification link to{' '}
            <span className="text-foreground font-medium">
              {email}
            </span>
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
            <label
              htmlFor="name"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
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

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
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
            {/* Password Strength Indicator */}
            {password && (
              <PasswordStrengthIndicator
                password={password}
              />
            )}
          </div>

          <Button
            type="submit"
            isLoading={loading}
            className="w-full py-6 text-base font-semibold rounded-xl shadow-lg shadow-primary/20"
          >
            {loading
              ? 'Creating account...'
              : 'Create account'}
          </Button>
        </form>

        <p className="mt-6 text-center text-muted-foreground text-sm">
          Already have an account?{' '}
          <Link
            href="/auth/login"
            className="text-primary hover:text-primary/80 transition-colors font-medium"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
