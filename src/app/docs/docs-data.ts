import {
  Rocket,
  Send,
  Users,
  LayoutTemplate,
  Key,
  Globe,
  Bell,
  BarChart3,
  Gauge,
  AlertTriangle,
  type LucideIcon,
} from 'lucide-react';

export interface DocPage {
  slug: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface DocSection {
  label: string;
  pages: DocPage[];
}

export const docSections: DocSection[] = [
  {
    label: 'Getting Started',
    pages: [
      {
        slug: 'getting-started',
        title: 'Quick Start',
        description: 'Send your first email in under 5 minutes.',
        icon: Rocket,
      },
    ],
  },
  {
    label: 'Sending Emails',
    pages: [
      {
        slug: 'send-email',
        title: 'Send Email',
        description: 'Send a single transactional email via the API.',
        icon: Send,
      },
      {
        slug: 'batch-sending',
        title: 'Batch Sending',
        description: 'Send up to 500 emails in a single API call.',
        icon: Users,
      },
      {
        slug: 'templates',
        title: 'Templates',
        description: 'Create reusable templates with dynamic variables.',
        icon: LayoutTemplate,
      },
    ],
  },
  {
    label: 'Configuration',
    pages: [
      {
        slug: 'api-keys',
        title: 'API Keys',
        description: 'Create and manage your API keys.',
        icon: Key,
      },
      {
        slug: 'domains',
        title: 'Custom Domains',
        description: 'Send from your own domain with DKIM verification.',
        icon: Globe,
      },
      {
        slug: 'webhooks',
        title: 'Webhooks',
        description: 'Real-time event notifications via HTTP.',
        icon: Bell,
      },
    ],
  },
  {
    label: 'Monitoring',
    pages: [
      {
        slug: 'analytics',
        title: 'Analytics',
        description: 'Track opens, clicks, bounces, and delivery rates.',
        icon: BarChart3,
      },
    ],
  },
  {
    label: 'Reference',
    pages: [
      {
        slug: 'rate-limits',
        title: 'Rate Limits',
        description: 'Understand plan limits and rate limit headers.',
        icon: Gauge,
      },
      {
        slug: 'error-handling',
        title: 'Error Handling',
        description: 'Error codes, formats, and troubleshooting.',
        icon: AlertTriangle,
      },
    ],
  },
];

export const allDocPages = docSections.flatMap((s) => s.pages);

export const docsNavLinks = [
  { href: '/#features', label: 'Features' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/docs', label: 'Docs' },
];
