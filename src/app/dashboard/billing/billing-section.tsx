'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  CreditCard,
  Sparkles,
  ExternalLink,
  Check,
} from 'lucide-react';

interface SubscriptionData {
  plan: string;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  hasSubscription: boolean;
}

export default function BillingSection() {
  const searchParams = useSearchParams();
  const [subscription, setSubscription] =
    useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);

  useEffect(() => {
    fetchSubscription();

    // Show toast if redirected from payment
    const paymentStatus = searchParams.get('payment');
    if (paymentStatus === 'success') {
      toast.success(
        'Payment successful! Your subscription is now active.',
      );
      window.history.replaceState(
        {},
        '',
        '/dashboard/billing',
      );
    } else if (paymentStatus === 'cancelled') {
      toast.error('Payment was cancelled.');
      window.history.replaceState(
        {},
        '',
        '/dashboard/billing',
      );
    }
  }, [searchParams]);

  async function fetchSubscription() {
    try {
      const res = await fetch('/api/billing/subscription');
      const data = await res.json();
      if (data.success) {
        setSubscription(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpgrade() {
    setUpgrading(true);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
      });
      const data = await res.json();

      if (data.success && data.data.checkoutUrl) {
        window.location.href = data.data.checkoutUrl;
      } else {
        toast.error(
          data.error || 'Failed to start checkout',
        );
        setUpgrading(false);
      }
    } catch (error) {
      toast.error('Failed to start checkout');
      setUpgrading(false);
    }
  }

  async function handleManageSubscription() {
    setOpeningPortal(true);
    try {
      const res = await fetch('/api/billing/portal', {
        method: 'POST',
      });
      const data = await res.json();

      if (data.success && data.data.portalUrl) {
        window.location.href = data.data.portalUrl;
      } else {
        toast.error(
          data.error || 'Failed to open billing portal',
        );
        setOpeningPortal(false);
      }
    } catch (error) {
      toast.error('Failed to open billing portal');
      setOpeningPortal(false);
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString(
      'en-US',
      {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      },
    );
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const isPro = subscription?.plan === 'pro';
  const isActive = subscription?.status === 'active';

  // Helper to get status display info
  function getStatusDisplay(status?: string) {
    switch (status) {
      case 'active':
        return {
          label: 'Active',
          className: 'bg-green-500/10 text-green-500',
        };
      case 'cancelled':
        return {
          label: 'Cancelling',
          className: 'bg-yellow-500/10 text-yellow-500',
        };
      case 'on_hold':
        return {
          label: 'Payment Failed',
          className: 'bg-red-500/10 text-red-500',
        };
      case 'expired':
        return {
          label: 'Expired',
          className: 'bg-muted text-muted-foreground',
        };
      default:
        return {
          label: 'Free',
          className: 'bg-muted text-muted-foreground',
        };
    }
  }

  const statusDisplay = getStatusDisplay(
    subscription?.status,
  );

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isPro ? (
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">
                  FWD Pro
                </h2>
              </div>
            ) : (
              <h2 className="text-xl font-semibold">
                Free Plan
              </h2>
            )}
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${statusDisplay.className}`}
            >
              {statusDisplay.label}
            </span>
          </div>
        </div>

        <p className="text-muted-foreground">
          {isPro
            ? 'You have access to all Pro features'
            : 'Upgrade to unlock more emails and domains'}
        </p>

        {isPro && subscription?.currentPeriodEnd && (
          <p className="text-sm text-muted-foreground">
            {subscription.cancelAtPeriodEnd ? (
              <span className="text-yellow-500">
                Access ends on{' '}
                {formatDate(subscription.currentPeriodEnd)}
              </span>
            ) : (
              <span>
                Renews on{' '}
                {formatDate(subscription.currentPeriodEnd)}
              </span>
            )}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          {!isPro || !isActive ? (
            <Button
              onClick={handleUpgrade}
              disabled={upgrading}
            >
              {upgrading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redirecting...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Upgrade to Pro — $4.99/mo
                </>
              )}
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={handleManageSubscription}
              disabled={openingPortal}
            >
              {openingPortal ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Opening...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Manage Subscription
                  <ExternalLink className="ml-2 h-3 w-3" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Plan Comparison */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">
          Plan Features
        </h3>
        <div className="grid md:grid-cols-2 gap-8">
          {/* Free */}
          <div className="space-y-3">
            <h4 className="font-medium">Free</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500 shrink-0" />
                100 emails/month
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500 shrink-0" />
                1 verified domain
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500 shrink-0" />
                5 templates
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500 shrink-0" />
                Basic analytics
              </li>
            </ul>
          </div>

          {/* Pro */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h4 className="font-medium">Pro</h4>
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary">
                $4.99/mo
              </span>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500 shrink-0" />
                5,000 emails/month
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500 shrink-0" />
                5 verified domains
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500 shrink-0" />
                Unlimited templates
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500 shrink-0" />
                Full analytics
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500 shrink-0" />
                Priority support
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
