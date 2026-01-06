'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import {
  Check,
  X,
  Sparkles,
  Zap,
  Building2,
  ArrowRight,
  Mail,
} from 'lucide-react';
import { Header, Footer } from '@/components/landing';

const tiers = [
  {
    name: 'Free',
    description: 'Perfect for getting started',
    price: '$0',
    period: '/month',
    highlight: false,
    comingSoon: false,
    cta: 'Get Started Free',
    ctaLink: '/auth/login',
    icon: Mail,
    features: {
      'Emails per day': '100',
      'API Keys': '3',
      Templates: '5',
      Webhooks: '2',
      'Analytics Dashboard': true,
      'Email Support': true,
      'Priority Support': false,
      'Custom Domain': false,
      'Dedicated IP': false,
      'SLA Guarantee': false,
    },
  },
  {
    name: 'Pro',
    description: 'For growing businesses',
    price: '$29',
    period: '/month',
    highlight: true,
    comingSoon: true,
    cta: 'Coming Soon',
    ctaLink: '#',
    icon: Zap,
    features: {
      'Emails per day': '10,000',
      'API Keys': '10',
      Templates: '50',
      Webhooks: '10',
      'Analytics Dashboard': true,
      'Email Support': true,
      'Priority Support': true,
      'Custom Domain': true,
      'Dedicated IP': false,
      'SLA Guarantee': false,
    },
  },
  {
    name: 'Enterprise',
    description: 'For large-scale operations',
    price: 'Custom',
    period: '',
    highlight: false,
    comingSoon: false,
    cta: 'Contact Sales',
    ctaLink: 'mailto:enterprise@fwd.email',
    icon: Building2,
    features: {
      'Emails per day': 'Unlimited',
      'API Keys': 'Unlimited',
      Templates: 'Unlimited',
      Webhooks: 'Unlimited',
      'Analytics Dashboard': true,
      'Email Support': true,
      'Priority Support': true,
      'Custom Domain': true,
      'Dedicated IP': true,
      'SLA Guarantee': true,
    },
  },
];

const featureList = [
  'Emails per day',
  'API Keys',
  'Templates',
  'Webhooks',
  'Analytics Dashboard',
  'Email Support',
  'Priority Support',
  'Custom Domain',
  'Dedicated IP',
  'SLA Guarantee',
];

export default function PricingPage() {
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
              <span className="gradient-text">pricing</span>
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
                className={`relative rounded-2xl p-8 ${
                  tier.highlight
                    ? 'bg-gradient-to-b from-primary/10 to-primary/5 border-2 border-primary shadow-xl shadow-primary/10'
                    : 'bg-card border border-border'
                }`}
              >
                {/* Most Popular Badge - above overlay */}
                {tier.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                    <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-full shadow-lg">
                      <Sparkles className="w-4 h-4" />
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Coming Soon Overlay - below badge */}
                {tier.comingSoon && (
                  <div className="absolute inset-0 bg-background/80 rounded-2xl flex items-center justify-center z-10">
                    <div className="text-center">
                      <span className="px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-full text-lg shadow-lg">
                        Coming Soon
                      </span>
                    </div>
                  </div>
                )}

                {/* Card Content */}
                <div
                  className={
                    tier.comingSoon ? 'opacity-50' : ''
                  }
                >
                  {/* Icon & Name */}
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`p-2 rounded-lg ${
                        tier.highlight
                          ? 'bg-primary/20 text-primary'
                          : 'bg-secondary text-foreground'
                      }`}
                    >
                      <tier.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">
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
                  <Link
                    href={tier.ctaLink}
                    className={`flex items-center justify-center gap-2 w-full py-3 px-4 rounded-lg font-medium transition-all mb-8 ${
                      tier.highlight
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25'
                        : tier.name === 'Enterprise'
                        ? 'bg-secondary text-foreground hover:bg-secondary/80 border border-border'
                        : 'bg-primary text-primary-foreground hover:bg-primary/90'
                    } ${
                      tier.comingSoon
                        ? 'pointer-events-none'
                        : ''
                    }`}
                  >
                    {tier.cta}
                    {!tier.comingSoon && (
                      <ArrowRight className="w-4 h-4" />
                    )}
                  </Link>

                  {/* Features List */}
                  <ul className="space-y-3">
                    {Object.entries(tier.features).map(
                      ([feature, value]) => (
                        <li
                          key={feature}
                          className="flex items-center gap-3 text-sm"
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
                                : 'text-foreground'
                            }
                          >
                            {feature}
                            {typeof value !== 'boolean' && (
                              <span className="text-muted-foreground ml-1">
                                ({value})
                              </span>
                            )}
                          </span>
                        </li>
                      )
                    )}
                  </ul>
                </div>
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
            className="overflow-x-auto"
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
                      {tier.comingSoon && (
                        <span className="block text-xs font-normal text-muted-foreground mt-1">
                          Coming Soon
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {featureList.map((feature, index) => (
                  <tr
                    key={feature}
                    className={`border-b border-border/50 ${
                      index % 2 === 0
                        ? 'bg-secondary/20'
                        : ''
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
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
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
