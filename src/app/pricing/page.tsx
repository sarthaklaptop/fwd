'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import {
  Check,
  X,
  Sparkles,
  Zap,
  Building2,
  ArrowRight,
  Mail,
  Loader2,
} from 'lucide-react';
import { Header, Footer } from '@/components/landing';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

const tiers = [
  {
    name: 'Free',
    description: 'Perfect for getting started',
    price: '$0',
    period: '/month',
    highlight: false,
    cta: 'Get Started Free',
    ctaAction: 'login',
    icon: Mail,
    features: {
      'Emails per month': '100',
      'Verified Domains': '1',
      'API Keys': '3',
      Templates: '5',
      Webhooks: '2',
      'Analytics Dashboard': true,
      'Email Support': true,
      'Priority Support': false,
    },
  },
  {
    name: 'Pro',
    description: 'For growing businesses',
    price: '$4.99',
    period: '/month',
    highlight: true,
    cta: 'Upgrade to Pro',
    ctaAction: 'upgrade',
    icon: Zap,
    features: {
      'Emails per month': '5,000',
      'Verified Domains': '5',
      'API Keys': '10',
      Templates: 'Unlimited',
      Webhooks: '10',
      'Analytics Dashboard': true,
      'Email Support': true,
      'Priority Support': true,
    },
  },
  {
    name: 'Enterprise',
    description: 'For large-scale operations',
    price: 'Custom',
    period: '',
    highlight: false,
    cta: 'Contact Sales',
    ctaAction: 'contact',
    ctaLink: 'mailto:enterprise@fwd.email',
    icon: Building2,
    features: {
      'Emails per month': 'Unlimited',
      'Verified Domains': 'Unlimited',
      'API Keys': 'Unlimited',
      Templates: 'Unlimited',
      Webhooks: 'Unlimited',
      'Analytics Dashboard': true,
      'Email Support': true,
      'Priority Support': true,
    },
  },
];

const featureList = [
  'Emails per month',
  'Verified Domains',
  'API Keys',
  'Templates',
  'Webhooks',
  'Analytics Dashboard',
  'Email Support',
  'Priority Support',
];

export default function PricingPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [upgradingPlan, setUpgradingPlan] = useState<
    string | null
  >(null);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUser(user);
    setLoading(false);
  }

  async function handleCtaClick(tier: (typeof tiers)[0]) {
    // Enterprise - just open email
    if (tier.ctaAction === 'contact' && tier.ctaLink) {
      window.location.href = tier.ctaLink;
      return;
    }

    // Free tier - go to login/dashboard
    if (tier.ctaAction === 'login') {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/auth/login');
      }
      return;
    }

    // Pro tier - upgrade flow
    if (tier.ctaAction === 'upgrade') {
      if (user) {
        // User is logged in - start checkout directly
        setUpgradingPlan(tier.name);
        try {
          const res = await fetch('/api/billing/checkout', {
            method: 'POST',
          });
          const data = await res.json();

          if (data.success && data.data.checkoutUrl) {
            window.location.href = data.data.checkoutUrl;
          } else if (
            data.code === 'UNAUTHORIZED' &&
            data.redirect
          ) {
            // Session expired - redirect to login
            router.push(data.redirect);
          } else {
            toast.error(
              data.error || 'Failed to start checkout',
            );
            setUpgradingPlan(null);
          }
        } catch (error) {
          toast.error('Failed to start checkout');
          setUpgradingPlan(null);
        }
      } else {
        // User not logged in - redirect to login with upgrade intent
        router.push('/auth/login?redirect=upgrade');
      }
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
              Simple, transparent{' '}
              <span className="text-primary">pricing</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Start free. Upgrade when you're ready. No
              hidden fees, no surprises.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {tiers.map((tier, index) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.1,
                }}
                className={`relative rounded-xl border p-6 ${
                  tier.highlight
                    ? 'border-primary bg-card'
                    : 'border-border bg-card'
                }`}
              >
                {/* Most Popular Badge */}
                {tier.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                      <Sparkles className="w-3 h-3" />
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Icon & Name */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`p-2 rounded-lg ${
                      tier.highlight
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    <tier.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">
                      {tier.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {tier.description}
                    </p>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <span className="text-4xl font-bold text-foreground">
                    {tier.price}
                  </span>
                  <span className="text-muted-foreground">
                    {tier.period}
                  </span>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handleCtaClick(tier)}
                  disabled={
                    loading || upgradingPlan === tier.name
                  }
                  className={`flex items-center justify-center gap-2 w-full py-3 px-4 rounded-lg font-medium transition-all mb-6 disabled:opacity-50 ${
                    tier.highlight
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : tier.name === 'Enterprise'
                        ? 'bg-muted text-foreground hover:bg-muted/80 border border-border'
                        : 'bg-primary text-primary-foreground hover:bg-primary/90'
                  }`}
                >
                  {upgradingPlan === tier.name ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Redirecting...
                    </>
                  ) : (
                    <>
                      {tier.cta}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Features List */}
                <ul className="space-y-3">
                  {Object.entries(tier.features).map(
                    ([feature, value]) => (
                      <li
                        key={feature}
                        className="flex items-center gap-2 text-sm"
                      >
                        {typeof value === 'boolean' ? (
                          value ? (
                            <Check className="w-4 h-4 text-green-500 shrink-0" />
                          ) : (
                            <X className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                          )
                        ) : (
                          <Check className="w-4 h-4 text-green-500 shrink-0" />
                        )}
                        <span
                          className={
                            typeof value === 'boolean' &&
                            !value
                              ? 'text-muted-foreground/50'
                              : 'text-muted-foreground'
                          }
                        >
                          {feature}
                          {typeof value !== 'boolean' && (
                            <span className="text-foreground font-medium ml-1">
                              ({value})
                            </span>
                          )}
                        </span>
                      </li>
                    ),
                  )}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-20 border-t border-border">
        <div className="mx-auto max-w-5xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Compare Plans
            </h2>
            <p className="text-muted-foreground">
              See what's included in each plan
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-xl border border-border bg-card overflow-hidden"
          >
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-4 font-medium text-muted-foreground">
                    Feature
                  </th>
                  {tiers.map((tier) => (
                    <th
                      key={tier.name}
                      className={`text-center py-4 px-4 font-semibold ${
                        tier.highlight
                          ? 'text-primary'
                          : 'text-foreground'
                      }`}
                    >
                      {tier.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {featureList.map((feature, index) => (
                  <tr
                    key={feature}
                    className={`border-b border-border/50 ${
                      index % 2 === 0 ? 'bg-muted/20' : ''
                    }`}
                  >
                    <td className="py-4 px-4 text-foreground">
                      {feature}
                    </td>
                    {tiers.map((tier) => {
                      const value =
                        tier.features[
                          feature as keyof typeof tier.features
                        ];
                      return (
                        <td
                          key={tier.name}
                          className="text-center py-4 px-4"
                        >
                          {typeof value === 'boolean' ? (
                            value ? (
                              <Check className="w-5 h-5 text-green-500 mx-auto" />
                            ) : (
                              <X className="w-5 h-5 text-muted-foreground/40 mx-auto" />
                            )
                          ) : (
                            <span
                              className={
                                tier.highlight
                                  ? 'font-medium text-primary'
                                  : 'text-foreground'
                              }
                            >
                              {value}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-t border-border">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Ready to get started?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Start sending emails in minutes. No credit
              card required.
            </p>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
