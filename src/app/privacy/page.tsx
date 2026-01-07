'use client';

import { Header, Footer } from '@/components/landing';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-20 max-w-4xl">
        <h1 className="text-4xl font-bold text-foreground mb-2">
          Privacy Policy
        </h1>
        <p className="text-muted-foreground mb-12">
          Last updated: January 7, 2025
        </p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              1. Information We Collect
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We collect the following types of information:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>
                <strong>Account Information:</strong> Email
                address, name, and password when you create
                an account
              </li>
              <li>
                <strong>Email Content:</strong> Email
                templates, recipient addresses, and message
                content you send through our Service
              </li>
              <li>
                <strong>Usage Data:</strong> API calls,
                email delivery statistics, open/click rates
              </li>
              <li>
                <strong>Technical Data:</strong> IP address,
                browser type, device information
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              2. How We Use Your Data
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We use your information to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>
                Provide and maintain the email delivery
                Service
              </li>
              <li>Process and deliver your emails</li>
              <li>
                Track delivery, opens, and clicks for
                analytics
              </li>
              <li>
                Send you service-related communications
              </li>
              <li>Improve and optimize our Service</li>
              <li>Detect and prevent fraud or abuse</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              3. Data Sharing
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We may share your data with:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>
                <strong>Service Providers:</strong> AWS
                (email delivery), Supabase (database),
                Vercel (hosting)
              </li>
              <li>
                <strong>Legal Requirements:</strong> When
                required by law or to protect our rights
              </li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              We do NOT sell your personal data to third
              parties.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              4. Data Retention
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your data for as long as your
              account is active. Email logs are retained for
              90 days. Upon account deletion, we will delete
              your data within 30 days, except where
              required by law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              5. Your Rights (GDPR)
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              If you are in the EU/EEA, you have the right
              to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>
                <strong>Access:</strong> Request a copy of
                your personal data
              </li>
              <li>
                <strong>Rectification:</strong> Correct
                inaccurate data
              </li>
              <li>
                <strong>Erasure:</strong> Request deletion
                of your data ("right to be forgotten")
              </li>
              <li>
                <strong>Portability:</strong> Receive your
                data in a portable format
              </li>
              <li>
                <strong>Objection:</strong> Object to
                processing of your data
              </li>
              <li>
                <strong>Restriction:</strong> Request
                limited processing
              </li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              To exercise these rights, contact us at{' '}
              <a
                href="mailto:privacy@fwd.sarthak.online"
                className="text-primary hover:underline"
              >
                privacy@fwd.sarthak.online
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              6. Cookies
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We use essential cookies for authentication
              and session management. We do not use
              advertising or tracking cookies. You can
              control cookies through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              7. Security
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement industry-standard security
              measures including encryption in transit
              (TLS), secure password hashing, API key
              protection, and regular security audits.
              However, no method of transmission over the
              Internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              8. Children&apos;s Privacy
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Our Service is not intended for children under
              16. We do not knowingly collect personal
              information from children. If you believe we
              have collected data from a child, please
              contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              9. International Data Transfers
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Your data may be processed in the United
              States and other countries where our service
              providers operate. We ensure appropriate
              safeguards are in place for international
              transfers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              10. Changes to This Policy
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to
              time. We will notify you of material changes
              via email or through the Service. Continued
              use after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              11. Contact Us
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              For privacy-related inquiries, please contact:{' '}
              <a
                href="mailto:privacy@fwd.sarthak.online"
                className="text-primary hover:underline"
              >
                privacy@fwd.sarthak.online
              </a>
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
