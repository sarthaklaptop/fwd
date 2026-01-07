'use client';

import { Header, Footer } from '@/components/landing';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-20 max-w-4xl">
        <h1 className="text-4xl font-bold text-foreground mb-2">
          Terms of Service
        </h1>
        <p className="text-muted-foreground mb-12">
          Last updated: January 7, 2025
        </p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              1. Acceptance of Terms
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using the FWD email delivery
              service ("Service"), you agree to be bound by
              these Terms of Service ("Terms"). If you do
              not agree to these Terms, you may not use the
              Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              2. Description of Service
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              FWD provides a transactional email delivery
              platform that allows you to send emails via
              our API. The Service includes email sending,
              delivery tracking, analytics, webhook
              notifications, and template management.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              3. User Accounts
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              To use the Service, you must create an
              account. You are responsible for:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>
                Maintaining the security of your account
                credentials and API keys
              </li>
              <li>
                All activities that occur under your account
              </li>
              <li>
                Notifying us immediately of any unauthorized
                use
              </li>
              <li>
                Ensuring your account information is
                accurate and up-to-date
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              4. Acceptable Use Policy
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You agree NOT to use the Service to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>
                Send spam, unsolicited emails, or bulk
                commercial emails without consent
              </li>
              <li>
                Send phishing, malware, or fraudulent
                content
              </li>
              <li>
                Violate any applicable laws or regulations
                (including CAN-SPAM, GDPR)
              </li>
              <li>
                Harvest email addresses or personal
                information without consent
              </li>
              <li>Impersonate another person or entity</li>
              <li>
                Send content that is illegal, harmful,
                threatening, or abusive
              </li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Violation of this policy may result in
              immediate account suspension or termination.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              5. API Usage Terms
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              When using our API, you agree to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>
                Respect rate limits and usage quotas for
                your plan
              </li>
              <li>
                Keep API keys confidential and not share
                them publicly
              </li>
              <li>
                Implement proper error handling and retry
                logic
              </li>
              <li>
                Not attempt to circumvent security measures
                or access controls
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              6. Data and Privacy
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Your use of the Service is also governed by
              our{' '}
              <a
                href="/privacy"
                className="text-primary hover:underline"
              >
                Privacy Policy
              </a>
              . You are responsible for ensuring you have
              proper consent to send emails to your
              recipients and handle their data
              appropriately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              7. Intellectual Property
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              The Service, including its design, code, and
              documentation, is owned by FWD. You retain
              ownership of your content (email templates,
              data). You grant us a license to process your
              content solely to provide the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              8. Limitation of Liability
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              THE SERVICE IS PROVIDED "AS IS" WITHOUT
              WARRANTIES OF ANY KIND. WE ARE NOT LIABLE FOR
              ANY INDIRECT, INCIDENTAL, SPECIAL, OR
              CONSEQUENTIAL DAMAGES ARISING FROM YOUR USE OF
              THE SERVICE. OUR TOTAL LIABILITY SHALL NOT
              EXCEED THE AMOUNT YOU PAID US IN THE PAST 12
              MONTHS.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              9. Termination
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Either party may terminate this agreement at
              any time. We may suspend or terminate your
              account immediately for violation of these
              Terms. Upon termination, your access to the
              Service will cease, and we may delete your
              data after a reasonable retention period.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              10. Changes to Terms
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update these Terms from time to time.
              We will notify you of material changes via
              email or through the Service. Continued use of
              the Service after changes constitutes
              acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              11. Contact Information
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions about these Terms, please
              contact us at:{' '}
              <a
                href="mailto:legal@fwd.sarthak.online"
                className="text-primary hover:underline"
              >
                legal@fwd.sarthak.online
              </a>
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
