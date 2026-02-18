import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Documentation - FWD',
  description:
    'Learn how to send transactional emails, manage templates, configure webhooks, and more with the FWD API.',
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
