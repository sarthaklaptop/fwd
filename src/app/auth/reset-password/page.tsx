'use client';

import { useState, useMemo, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, X, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

// Password strength calculation (same as signup)
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
    [password]
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

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] =
    useState('');
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if user has a valid session (came from reset link)
    const checkSession = async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        setIsReady(true);
      } else {
        toast.error('Invalid or expired reset link');
        router.push('/auth/forgot-password');
      }
    };

    checkSession();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (error) {
      toast.error(
        error.message || 'Failed to update password'
      );
    } else {
      toast.success('Password updated successfully!');
      router.push('/auth/login');
    }
  };

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">
          Verifying...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-primary/5"></div>

      <div className="relative bg-card/80 backdrop-blur-xl border border-border p-8 rounded-2xl shadow-2xl w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Link href="/" className="text-3xl font-bold">
            <span className="gradient-text">FWD</span>
          </Link>
        </div>

        <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="w-6 h-6 text-primary" />
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-2 text-center">
          Set new password
        </h1>
        <p className="text-muted-foreground text-sm text-center mb-6">
          Choose a strong password for your account
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              New password
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
            {password && (
              <PasswordStrengthIndicator
                password={password}
              />
            )}
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(e.target.value)
              }
              className={`w-full px-4 py-3 bg-background border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all ${
                confirmPassword &&
                password !== confirmPassword
                  ? 'border-red-500'
                  : 'border-border'
              }`}
              placeholder="••••••••"
              minLength={6}
              required
            />
            {confirmPassword &&
              password !== confirmPassword && (
                <p className="text-red-500 text-xs mt-1.5">
                  Passwords do not match
                </p>
              )}
          </div>

          <Button
            type="submit"
            isLoading={loading}
            disabled={
              loading || password !== confirmPassword
            }
            className="w-full py-6 text-base font-semibold rounded-xl shadow-lg shadow-primary/20"
          >
            {loading ? 'Updating...' : 'Update password'}
          </Button>
        </form>
      </div>
    </div>
  );
}
