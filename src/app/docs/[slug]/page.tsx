'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Header, Footer } from '@/components/landing';
import { DocsSidebar } from '../docs-sidebar';
import { allDocPages, docsNavLinks } from '../docs-data';
import {
  CodeBlock,
  EndpointBadge,
  ParamTable,
  ResponseTable,
  Callout,
  SectionHeading,
  SubHeading,
  InlineCode,
  Paragraph,
} from '../docs-components';

function GettingStartedContent() {
  return (
    <>
      <Paragraph>
        Get up and running with FWD in under 5 minutes. This
        guide walks you through creating an account,
        generating an API key, and sending your first email.
      </Paragraph>

      <SectionHeading>1. Create an Account</SectionHeading>
      <Paragraph>
        Sign up for a free account at{' '}
        <Link
          href="/auth/signup"
          className="text-primary hover:underline"
        >
          fwd.email/auth/signup
        </Link>
        . No credit card required — the free plan includes
        100 emails per month.
      </Paragraph>

      <SectionHeading>
        2. Generate an API Key
      </SectionHeading>
      <Paragraph>
        Navigate to the{' '}
        <Link
          href="/dashboard/api-keys"
          className="text-primary hover:underline"
        >
          API Keys
        </Link>{' '}
        section in your dashboard and create a new key. Give
        it a descriptive name like &ldquo;Production&rdquo;
        or &ldquo;Development&rdquo;.
      </Paragraph>
      <Callout type="warning" title="Save your API key">
        Your full API key is only shown once at creation
        time. Copy and store it securely — you won&apos;t be
        able to see it again.
      </Callout>

      <SectionHeading>
        3. Send Your First Email
      </SectionHeading>
      <Paragraph>
        Use the <InlineCode>x-api-key</InlineCode> header to
        authenticate, and send a POST request to{' '}
        <InlineCode>/api/send</InlineCode>:
      </Paragraph>
      <CodeBlock
        title="cURL"
        code={`curl -X POST https://fwd.sarthak.online/api/send \\
  -H "x-api-key: fwd_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "user@example.com",
    "subject": "Hello from FWD!",
    "html": "<h1>Welcome!</h1><p>Your first email via FWD.</p>"
  }'`}
      />
      <CodeBlock
        title="Node.js"
        language="javascript"
        code={`const response = await fetch("https://fwd.sarthak.online/api/send", {
  method: "POST",
  headers: {
    "x-api-key": "fwd_your_api_key_here",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    to: "user@example.com",
    subject: "Hello from FWD!",
    html: "<h1>Welcome!</h1><p>Your first email via FWD.</p>",
  }),
});

const data = await response.json();
console.log(data);`}
      />
      <CodeBlock
        title="Python"
        language="python"
        code={`import requests

response = requests.post(
    "https://fwd.sarthak.online/api/send",
    headers={
        "x-api-key": "fwd_your_api_key_here",
        "Content-Type": "application/json",
    },
    json={
        "to": "user@example.com",
        "subject": "Hello from FWD!",
        "html": "<h1>Welcome!</h1><p>Your first email via FWD.</p>",
    },
)
print(response.json())`}
      />

      <SubHeading>Successful Response</SubHeading>
      <CodeBlock
        title="Response (200 OK)"
        language="json"
        code={`{
  "success": true,
  "emailId": "abc123-def456",
  "messageId": "msg_789",
  "status": "queued",
  "rateLimit": {
    "limit": 100,
    "remaining": 99
  }
}`}
      />

      <SectionHeading>Next Steps</SectionHeading>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
        {[
          {
            href: '/docs/send-email',
            label: 'Send Email API',
            desc: 'Full API reference',
          },
          {
            href: '/docs/batch-sending',
            label: 'Batch Sending',
            desc: 'Send bulk emails',
          },
          {
            href: '/docs/templates',
            label: 'Templates',
            desc: 'Reusable email templates',
          },
          {
            href: '/docs/webhooks',
            label: 'Webhooks',
            desc: 'Real-time event tracking',
          },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group p-4 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors"
          >
            <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
              {item.label}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {item.desc}
            </p>
          </Link>
        ))}
      </div>
    </>
  );
}

function SendEmailContent() {
  return (
    <>
      <Paragraph>
        Send a single transactional email using the FWD API.
        Supports HTML content, plain text, template
        rendering, custom sender domains, and reply-to
        addresses.
      </Paragraph>

      <EndpointBadge method="POST" path="/api/send" />

      <SectionHeading>Authentication</SectionHeading>
      <Paragraph>
        Include your API key in the{' '}
        <InlineCode>x-api-key</InlineCode> request header.
        Keys are created in the dashboard and have a{' '}
        <InlineCode>fwd_</InlineCode> prefix.
      </Paragraph>

      <SectionHeading>Request Body</SectionHeading>
      <ParamTable
        params={[
          {
            name: 'to',
            type: 'string',
            required: true,
            description: 'Recipient email address',
          },
          {
            name: 'subject',
            type: 'string',
            required: true,
            description:
              'Email subject line (not required if using templateId)',
          },
          {
            name: 'html',
            type: 'string',
            required: true,
            description:
              'HTML email body (or provide text, or use templateId)',
          },
          {
            name: 'text',
            type: 'string',
            required: false,
            description: 'Plain text fallback body',
          },
          {
            name: 'from',
            type: 'string',
            required: false,
            description:
              'Custom sender address (requires verified domain)',
          },
          {
            name: 'replyTo',
            type: 'string',
            required: false,
            description: 'Reply-to email address',
          },
          {
            name: 'templateId',
            type: 'string',
            required: false,
            description: 'Use a saved template by ID',
          },
          {
            name: 'variables',
            type: 'object',
            required: false,
            description:
              'Key-value pairs for template variable substitution',
          },
        ]}
      />

      <SectionHeading>Example Request</SectionHeading>
      <CodeBlock
        title="cURL"
        code={`curl -X POST https://fwd.sarthak.online/api/send \\
  -H "x-api-key: fwd_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "user@example.com",
    "subject": "Order Confirmed",
    "html": "<h1>Order #1234</h1><p>Your order has been confirmed.</p>",
    "replyTo": "support@yourcompany.com"
  }'`}
      />

      <SectionHeading>Using Templates</SectionHeading>
      <Paragraph>
        Instead of providing{' '}
        <InlineCode>subject</InlineCode> and{' '}
        <InlineCode>html</InlineCode> directly, reference a
        saved template by ID and pass variables for dynamic
        content.
      </Paragraph>
      <CodeBlock
        title="Template-based send"
        code={`curl -X POST https://fwd.sarthak.online/api/send \\
  -H "x-api-key: fwd_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "user@example.com",
    "templateId": "tmpl_abc123",
    "variables": {
      "name": "John",
      "orderNumber": "#1234"
    }
  }'`}
      />

      <SectionHeading>Custom From Address</SectionHeading>
      <Paragraph>
        By default, emails are sent from{' '}
        <InlineCode>noreply@fwd.sarthak.online</InlineCode>.
        To send from your own domain, first verify it in the{' '}
        <Link
          href="/docs/domains"
          className="text-primary hover:underline"
        >
          Domains
        </Link>{' '}
        section, then pass the <InlineCode>from</InlineCode>{' '}
        field.
      </Paragraph>
      <CodeBlock
        title="Custom sender"
        code={`{
  "to": "user@example.com",
  "from": "Hello Team <hello@yourdomain.com>",
  "subject": "Welcome!",
  "html": "<p>Hello from our domain.</p>"
}`}
      />

      <SectionHeading>Response</SectionHeading>
      <ResponseTable
        fields={[
          {
            name: 'success',
            type: 'boolean',
            description: 'Whether the email was accepted',
          },
          {
            name: 'emailId',
            type: 'string',
            description: 'Unique identifier for this email',
          },
          {
            name: 'messageId',
            type: 'string',
            description: 'Queue message ID',
          },
          {
            name: 'status',
            type: 'string',
            description:
              '"queued" in production, "sent" in development',
          },
          {
            name: 'rateLimit.limit',
            type: 'number',
            description: 'Your monthly email limit',
          },
          {
            name: 'rateLimit.remaining',
            type: 'number',
            description: 'Emails remaining this month',
          },
        ]}
      />

      <SectionHeading>Suppression List</SectionHeading>
      <Paragraph>
        Emails to addresses on the suppression list (bounced
        or complained) are automatically blocked and return
        a <InlineCode>400</InlineCode> error. This protects
        your sender reputation.
      </Paragraph>
      <Callout type="info" title="Open tracking">
        FWD automatically injects a 1×1 tracking pixel into
        HTML emails to track opens. Unsubscribe links are
        also injected for CAN-SPAM compliance in batch
        emails.
      </Callout>
    </>
  );
}

function BatchSendingContent() {
  return (
    <>
      <Paragraph>
        Send up to 500 emails in a single API call. Supports
        both template-based sending with per-recipient
        variables, and direct mode with individual email
        content.
      </Paragraph>

      <EndpointBadge method="POST" path="/api/send/batch" />

      <SectionHeading>Two Sending Modes</SectionHeading>
      <Paragraph>
        The batch endpoint supports two mutually exclusive
        modes:
      </Paragraph>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
        <div className="p-4 rounded-xl border border-border bg-card">
          <h4 className="font-semibold text-foreground mb-1">
            Template Mode
          </h4>
          <p className="text-sm text-muted-foreground">
            Provide <InlineCode>templateId</InlineCode> +{' '}
            <InlineCode>recipients</InlineCode> array. Each
            recipient can have unique variables.
          </p>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card">
          <h4 className="font-semibold text-foreground mb-1">
            Direct Mode
          </h4>
          <p className="text-sm text-muted-foreground">
            Provide an <InlineCode>emails</InlineCode> array
            where each item has its own subject and content.
          </p>
        </div>
      </div>

      <SectionHeading>Template Mode</SectionHeading>
      <ParamTable
        params={[
          {
            name: 'templateId',
            type: 'string',
            required: true,
            description: 'ID of the template to use',
          },
          {
            name: 'recipients',
            type: 'array',
            required: true,
            description:
              'Array of recipient objects (max 500)',
          },
          {
            name: 'recipients[].to',
            type: 'string',
            required: true,
            description: 'Recipient email address',
          },
          {
            name: 'recipients[].variables',
            type: 'object',
            required: false,
            description:
              'Template variables for this recipient',
          },
        ]}
      />
      <CodeBlock
        title="Template mode request"
        code={`curl -X POST https://fwd.sarthak.online/api/send/batch \\
  -H "x-api-key: fwd_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "templateId": "tmpl_abc123",
    "recipients": [
      {
        "to": "alice@example.com",
        "variables": { "name": "Alice", "plan": "Pro" }
      },
      {
        "to": "bob@example.com",
        "variables": { "name": "Bob", "plan": "Free" }
      }
    ]
  }'`}
      />

      <SectionHeading>Direct Mode</SectionHeading>
      <ParamTable
        params={[
          {
            name: 'emails',
            type: 'array',
            required: true,
            description: 'Array of email objects (max 500)',
          },
          {
            name: 'emails[].to',
            type: 'string',
            required: true,
            description: 'Recipient email address',
          },
          {
            name: 'emails[].subject',
            type: 'string',
            required: true,
            description: 'Email subject line',
          },
          {
            name: 'emails[].html',
            type: 'string',
            required: false,
            description:
              'HTML content (html or text required)',
          },
          {
            name: 'emails[].text',
            type: 'string',
            required: false,
            description: 'Plain text content',
          },
        ]}
      />
      <CodeBlock
        title="Direct mode request"
        code={`curl -X POST https://fwd.sarthak.online/api/send/batch \\
  -H "x-api-key: fwd_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "emails": [
      {
        "to": "alice@example.com",
        "subject": "Your invoice is ready",
        "html": "<p>Invoice #001 for Alice</p>"
      },
      {
        "to": "bob@example.com",
        "subject": "Your invoice is ready",
        "html": "<p>Invoice #002 for Bob</p>"
      }
    ]
  }'`}
      />

      <SectionHeading>Response</SectionHeading>
      <ResponseTable
        fields={[
          {
            name: 'batchId',
            type: 'string',
            description:
              'Unique batch identifier for tracking',
          },
          {
            name: 'status',
            type: 'string',
            description:
              '"processing", "completed", "partial", or "failed"',
          },
          {
            name: 'message',
            type: 'string',
            description: 'Human-readable status message',
          },
          {
            name: 'total',
            type: 'number',
            description: 'Total recipients submitted',
          },
          {
            name: 'queued',
            type: 'number',
            description:
              'Number of emails accepted for delivery',
          },
          {
            name: 'suppressed',
            type: 'number',
            description:
              'Recipients skipped (on suppression list)',
          },
          {
            name: 'duplicates',
            type: 'number',
            description: 'Duplicate emails removed',
          },
          {
            name: 'errors',
            type: 'array',
            description:
              'Array of {index, to, error} for failed validations',
          },
          {
            name: 'rateLimit',
            type: 'object',
            description: '{limit, remaining} for your plan',
          },
        ]}
      />

      <SectionHeading>Features</SectionHeading>
      <Callout type="tip" title="Built-in protections">
        Batch sending automatically deduplicates recipients,
        filters suppressed addresses, validates email
        formats, and respects your plan&apos;s monthly
        limit.
      </Callout>
      <Callout type="info" title="Link tracking">
        Links in batch emails are automatically replaced
        with tracked short URLs. Click data is available in
        the Analytics dashboard and via webhook events.
      </Callout>
    </>
  );
}

function TemplatesContent() {
  return (
    <>
      <Paragraph>
        Templates let you create reusable email layouts with
        dynamic variable substitution. Use{' '}
        <InlineCode>{'{{variableName}}'}</InlineCode> syntax
        in both the subject and HTML body.
      </Paragraph>

      <SectionHeading>Endpoints</SectionHeading>
      <div className="space-y-2">
        <EndpointBadge method="GET" path="/api/templates" />
        <EndpointBadge
          method="POST"
          path="/api/templates"
        />
        <EndpointBadge
          method="GET"
          path="/api/templates/:id"
        />
        <EndpointBadge
          method="PUT"
          path="/api/templates/:id"
        />
        <EndpointBadge
          method="DELETE"
          path="/api/templates/:id"
        />
      </div>

      <SectionHeading>Create a Template</SectionHeading>
      <ParamTable
        params={[
          {
            name: 'name',
            type: 'string',
            required: true,
            description: 'Template name for reference',
          },
          {
            name: 'subject',
            type: 'string',
            required: true,
            description:
              'Email subject (supports {{variables}})',
          },
          {
            name: 'html',
            type: 'string',
            required: true,
            description:
              'HTML content (supports {{variables}})',
          },
        ]}
      />
      <CodeBlock
        title="Create template"
        code={`curl -X POST https://fwd.sarthak.online/api/templates \\
  -H "Cookie: your-session-cookie" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Welcome Email",
    "subject": "Welcome, {{name}}!",
    "html": "<h1>Hello {{name}}</h1><p>Welcome to {{company}}.</p>"
  }'`}
      />
      <Callout type="info" title="Auto-detected variables">
        Variables are automatically extracted from your
        subject and HTML content. Any{' '}
        <InlineCode>{'{{variableName}}'}</InlineCode>{' '}
        patterns are detected and stored with the template.
      </Callout>

      <SectionHeading>Variable Substitution</SectionHeading>
      <Paragraph>
        When sending emails with a template, pass a{' '}
        <InlineCode>variables</InlineCode> object to replace
        placeholders with actual values.
      </Paragraph>
      <CodeBlock
        title="Send with template variables"
        code={`// POST /api/send
{
  "to": "user@example.com",
  "templateId": "tmpl_abc123",
  "variables": {
    "name": "Sarah",
    "company": "Acme Inc"
  }
}`}
      />
      <Paragraph>
        The above request with the &ldquo;Welcome
        Email&rdquo; template would produce:
      </Paragraph>
      <ul className="list-disc pl-6 text-muted-foreground space-y-1 mb-4 text-sm">
        <li>
          Subject: <InlineCode>Welcome, Sarah!</InlineCode>
        </li>
        <li>
          Body:{' '}
          <InlineCode>
            {
              '<h1>Hello Sarah</h1><p>Welcome to Acme Inc.</p>'
            }
          </InlineCode>
        </li>
      </ul>

      <SectionHeading>Update a Template</SectionHeading>
      <CodeBlock
        title="Update template"
        code={`curl -X PUT https://fwd.sarthak.online/api/templates/tmpl_abc123 \\
  -H "Cookie: your-session-cookie" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Welcome Email v2",
    "subject": "Welcome aboard, {{name}}!",
    "html": "<h1>Hey {{name}}!</h1><p>We are glad to have you.</p>"
  }'`}
      />

      <SectionHeading>Delete a Template</SectionHeading>
      <CodeBlock
        title="Delete template"
        code={`curl -X DELETE https://fwd.sarthak.online/api/templates/tmpl_abc123 \\
  -H "Cookie: your-session-cookie"`}
      />

      <SectionHeading>Plan Limits</SectionHeading>
      <div className="overflow-x-auto my-4 rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left py-3 px-4 font-semibold text-foreground">
                Plan
              </th>
              <th className="text-left py-3 px-4 font-semibold text-foreground">
                Templates
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-card">
              <td className="py-3 px-4 text-foreground">
                Free
              </td>
              <td className="py-3 px-4 text-muted-foreground">
                5
              </td>
            </tr>
            <tr className="bg-muted/10">
              <td className="py-3 px-4 text-foreground">
                Pro
              </td>
              <td className="py-3 px-4 text-muted-foreground">
                Unlimited
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

function ApiKeysContent() {
  return (
    <>
      <Paragraph>
        API keys authenticate your requests to the FWD API.
        Each key has a<InlineCode>fwd_</InlineCode> prefix
        and is hashed server-side for security.
      </Paragraph>

      <SectionHeading>Endpoints</SectionHeading>
      <div className="space-y-2">
        <EndpointBadge method="GET" path="/api/keys" />
        <EndpointBadge method="POST" path="/api/keys" />
        <EndpointBadge
          method="DELETE"
          path="/api/keys/:id"
        />
      </div>

      <SectionHeading>Create an API Key</SectionHeading>
      <ParamTable
        params={[
          {
            name: 'name',
            type: 'string',
            required: true,
            description:
              'A descriptive name for the key (max 50 characters)',
          },
        ]}
      />
      <CodeBlock
        title="Create key"
        code={`curl -X POST https://fwd.sarthak.online/api/keys \\
  -H "Cookie: your-session-cookie" \\
  -H "Content-Type: application/json" \\
  -d '{ "name": "Production" }'`}
      />
      <SubHeading>Response</SubHeading>
      <CodeBlock
        title="Response (201 Created)"
        language="json"
        code={`{
  "success": true,
  "data": {
    "id": "key_abc123",
    "name": "Production",
    "key": "fwd_sk_a1b2c3d4e5f6...",
    "keyPrefix": "fwd_sk_a1b2",
    "createdAt": "2025-01-15T10:00:00Z"
  },
  "message": "API key created successfully"
}`}
      />
      <Callout
        type="warning"
        title="Store your key securely"
      >
        The full API key (<InlineCode>key</InlineCode>{' '}
        field) is only returned once at creation time. Store
        it in a secure location like an environment
        variable. You will not be able to retrieve it later
        — only the <InlineCode>keyPrefix</InlineCode> is
        stored.
      </Callout>

      <SectionHeading>Using Your API Key</SectionHeading>
      <Paragraph>
        Include your API key in the{' '}
        <InlineCode>x-api-key</InlineCode> header for all
        API requests that require authentication.
      </Paragraph>
      <CodeBlock
        title="Authentication header"
        code={`curl -X POST https://fwd.sarthak.online/api/send \\
  -H "x-api-key: fwd_sk_a1b2c3d4e5f6..." \\
  -H "Content-Type: application/json" \\
  -d '{ "to": "user@example.com", "subject": "Test", "html": "<p>Hello</p>" }'`}
      />

      <SectionHeading>Revoke a Key</SectionHeading>
      <Paragraph>
        Revoked keys are immediately deactivated and cannot
        be used for authentication.
      </Paragraph>
      <CodeBlock
        title="Revoke key"
        code={`curl -X DELETE https://fwd.sarthak.online/api/keys/key_abc123 \\
  -H "Cookie: your-session-cookie"`}
      />

      <SectionHeading>
        Security Best Practices
      </SectionHeading>
      <ul className="list-disc pl-6 text-muted-foreground space-y-2 text-sm mb-4">
        <li>Never commit API keys to version control</li>
        <li>
          Use environment variables (
          <InlineCode>FWD_API_KEY</InlineCode>) to store
          keys
        </li>
        <li>
          Create separate keys for development and
          production
        </li>
        <li>
          Revoke unused or compromised keys immediately
        </li>
        <li>
          Rotate keys periodically for enhanced security
        </li>
      </ul>

      <SectionHeading>Plan Limits</SectionHeading>
      <div className="overflow-x-auto my-4 rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left py-3 px-4 font-semibold text-foreground">
                Plan
              </th>
              <th className="text-left py-3 px-4 font-semibold text-foreground">
                API Keys
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-card">
              <td className="py-3 px-4 text-foreground">
                Free
              </td>
              <td className="py-3 px-4 text-muted-foreground">
                3
              </td>
            </tr>
            <tr className="bg-muted/10">
              <td className="py-3 px-4 text-foreground">
                Pro
              </td>
              <td className="py-3 px-4 text-muted-foreground">
                10
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

function DomainsContent() {
  return (
    <>
      <Paragraph>
        By default, emails are sent from{' '}
        <InlineCode>noreply@fwd.sarthak.online</InlineCode>.
        Add and verify your own domain to send from any
        address on it, improving deliverability and brand
        trust.
      </Paragraph>

      <SectionHeading>Endpoints</SectionHeading>
      <div className="space-y-2">
        <EndpointBadge method="GET" path="/api/domains" />
        <EndpointBadge method="POST" path="/api/domains" />
        <EndpointBadge
          method="POST"
          path="/api/domains/:id/verify"
        />
        <EndpointBadge
          method="DELETE"
          path="/api/domains/:id"
        />
      </div>

      <SectionHeading>Add a Domain</SectionHeading>
      <ParamTable
        params={[
          {
            name: 'domain',
            type: 'string',
            required: true,
            description:
              'Your domain name (e.g., example.com)',
          },
        ]}
      />
      <CodeBlock
        title="Add domain"
        code={`curl -X POST https://fwd.sarthak.online/api/domains \\
  -H "Cookie: your-session-cookie" \\
  -H "Content-Type: application/json" \\
  -d '{ "domain": "yourdomain.com" }'`}
      />
      <Paragraph>
        The response includes DNS records you need to
        configure:
      </Paragraph>
      <CodeBlock
        title="Response (with DNS records)"
        language="json"
        code={`{
  "success": true,
  "message": "Domain added. Please add the DNS records below.",
  "data": {
    "id": "dom_abc123",
    "domain": "yourdomain.com",
    "status": "pending",
    "dkimTokens": ["token1", "token2", "token3"],
    "dnsRecords": {
      "dkim": [
        {
          "type": "CNAME",
          "name": "token1._domainkey.yourdomain.com",
          "value": "token1.dkim.amazonses.com"
        },
        {
          "type": "CNAME",
          "name": "token2._domainkey.yourdomain.com",
          "value": "token2.dkim.amazonses.com"
        },
        {
          "type": "CNAME",
          "name": "token3._domainkey.yourdomain.com",
          "value": "token3.dkim.amazonses.com"
        }
      ],
      "spf": {
        "type": "TXT",
        "name": "yourdomain.com",
        "value": "v=spf1 include:amazonses.com ~all"
      }
    }
  }
}`}
      />

      <SectionHeading>Configure DNS Records</SectionHeading>
      <Paragraph>
        After adding your domain, configure these records
        with your DNS provider:
      </Paragraph>

      <SubHeading>DKIM Records (3× CNAME)</SubHeading>
      <Paragraph>
        Add three CNAME records for DKIM email
        authentication. These verify that your emails are
        actually sent from your domain.
      </Paragraph>
      <div className="overflow-x-auto my-4 rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left py-3 px-4 font-semibold text-foreground">
                Type
              </th>
              <th className="text-left py-3 px-4 font-semibold text-foreground">
                Name
              </th>
              <th className="text-left py-3 px-4 font-semibold text-foreground">
                Value
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-card">
              <td className="py-3 px-4 font-mono text-xs text-muted-foreground">
                CNAME
              </td>
              <td className="py-3 px-4 font-mono text-xs text-primary">
                {'<token>._domainkey.yourdomain.com'}
              </td>
              <td className="py-3 px-4 font-mono text-xs text-muted-foreground">
                {'<token>.dkim.amazonses.com'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <SubHeading>SPF Record (1× TXT)</SubHeading>
      <div className="overflow-x-auto my-4 rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left py-3 px-4 font-semibold text-foreground">
                Type
              </th>
              <th className="text-left py-3 px-4 font-semibold text-foreground">
                Name
              </th>
              <th className="text-left py-3 px-4 font-semibold text-foreground">
                Value
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-card">
              <td className="py-3 px-4 font-mono text-xs text-muted-foreground">
                TXT
              </td>
              <td className="py-3 px-4 font-mono text-xs text-primary">
                yourdomain.com
              </td>
              <td className="py-3 px-4 font-mono text-xs text-muted-foreground">
                v=spf1 include:amazonses.com ~all
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <SectionHeading>Verify Domain</SectionHeading>
      <Paragraph>
        After adding DNS records, wait for propagation
        (usually 10 minutes to 48 hours), then trigger
        verification:
      </Paragraph>
      <CodeBlock
        title="Verify domain"
        code={`curl -X POST https://fwd.sarthak.online/api/domains/dom_abc123/verify \\
  -H "Cookie: your-session-cookie"`}
      />
      <Callout type="tip" title="DNS propagation">
        DNS changes typically take 10–60 minutes but can
        take up to 48 hours. If verification fails, wait and
        try again. You can check propagation using tools
        like <InlineCode>dig</InlineCode> or online DNS
        lookup services.
      </Callout>

      <SectionHeading>Plan Limits</SectionHeading>
      <div className="overflow-x-auto my-4 rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left py-3 px-4 font-semibold text-foreground">
                Plan
              </th>
              <th className="text-left py-3 px-4 font-semibold text-foreground">
                Verified Domains
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-card">
              <td className="py-3 px-4 text-foreground">
                Free
              </td>
              <td className="py-3 px-4 text-muted-foreground">
                1
              </td>
            </tr>
            <tr className="bg-muted/10">
              <td className="py-3 px-4 text-foreground">
                Pro
              </td>
              <td className="py-3 px-4 text-muted-foreground">
                5
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

function WebhooksContent() {
  return (
    <>
      <Paragraph>
        Webhooks send real-time HTTP POST notifications to
        your server when email events occur. All payloads
        are signed with HMAC-SHA256 for verification.
      </Paragraph>

      <SectionHeading>Endpoints</SectionHeading>
      <div className="space-y-2">
        <EndpointBadge method="GET" path="/api/webhooks" />
        <EndpointBadge method="POST" path="/api/webhooks" />
        <EndpointBadge
          method="DELETE"
          path="/api/webhooks/:id"
        />
      </div>

      <SectionHeading>Create a Webhook</SectionHeading>
      <ParamTable
        params={[
          {
            name: 'url',
            type: 'string',
            required: true,
            description:
              'HTTPS endpoint URL to receive events',
          },
          {
            name: 'events',
            type: 'string[]',
            required: true,
            description:
              'Array of event types to subscribe to',
          },
        ]}
      />
      <CodeBlock
        title="Create webhook"
        code={`curl -X POST https://fwd.sarthak.online/api/webhooks \\
  -H "Cookie: your-session-cookie" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://yourapp.com/webhooks/fwd",
    "events": ["email.delivered", "email.opened", "email.bounced"]
  }'`}
      />
      <Paragraph>
        The response includes a{' '}
        <InlineCode>secret</InlineCode> (prefixed with{' '}
        <InlineCode>whsec_</InlineCode>) used to verify
        webhook signatures.
      </Paragraph>

      <SectionHeading>Event Types</SectionHeading>
      <div className="overflow-x-auto my-4 rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left py-3 px-4 font-semibold text-foreground">
                Event
              </th>
              <th className="text-left py-3 px-4 font-semibold text-foreground">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              [
                'email.sent',
                'Email accepted and queued for delivery',
              ],
              [
                'email.delivered',
                "Email successfully delivered to the recipient's mail server",
              ],
              [
                'email.opened',
                'Recipient opened the email (via tracking pixel)',
              ],
              [
                'email.clicked',
                'Recipient clicked a tracked link in the email',
              ],
              [
                'email.bounced',
                'Email bounced — address added to suppression list',
              ],
              [
                'email.complained',
                'Recipient marked the email as spam',
              ],
              [
                'email.unsubscribed',
                'Recipient clicked the unsubscribe link',
              ],
            ].map(([event, desc], i) => (
              <tr
                key={event}
                className={
                  i % 2 === 0 ? 'bg-card' : 'bg-muted/10'
                }
              >
                <td className="py-3 px-4 font-mono text-xs text-primary">
                  {event}
                </td>
                <td className="py-3 px-4 text-muted-foreground">
                  {desc}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SectionHeading>Webhook Payload</SectionHeading>
      <Paragraph>
        Each webhook delivery includes these headers and a
        JSON body:
      </Paragraph>
      <div className="overflow-x-auto my-4 rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left py-3 px-4 font-semibold text-foreground">
                Header
              </th>
              <th className="text-left py-3 px-4 font-semibold text-foreground">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-card">
              <td className="py-3 px-4 font-mono text-xs text-primary">
                X-Fwd-Event
              </td>
              <td className="py-3 px-4 text-muted-foreground">
                The event type (e.g., email.delivered)
              </td>
            </tr>
            <tr className="bg-muted/10">
              <td className="py-3 px-4 font-mono text-xs text-primary">
                X-Fwd-Signature
              </td>
              <td className="py-3 px-4 text-muted-foreground">
                HMAC-SHA256 signature for verification
              </td>
            </tr>
            <tr className="bg-card">
              <td className="py-3 px-4 font-mono text-xs text-primary">
                Content-Type
              </td>
              <td className="py-3 px-4 text-muted-foreground">
                application/json
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <CodeBlock
        title="Example payload"
        language="json"
        code={`{
  "emailId": "email_abc123",
  "to": "user@example.com",
  "timestamp": "2025-01-15T12:00:00.000Z"
}`}
      />

      <SectionHeading>
        Signature Verification
      </SectionHeading>
      <Paragraph>
        The <InlineCode>X-Fwd-Signature</InlineCode> header
        contains a timestamp and HMAC-SHA256 hash in the
        format:{' '}
        <InlineCode>{'t={timestamp},v1={hash}'}</InlineCode>
        . Verify it to ensure the webhook is authentic.
      </Paragraph>
      <CodeBlock
        title="Node.js verification example"
        language="javascript"
        code={`const crypto = require('crypto');

function verifyWebhookSignature(req, secret) {
  const signature = req.headers['x-fwd-signature'];
  const [tPart, vPart] = signature.split(',');
  const timestamp = tPart.replace('t=', '');
  const receivedHash = vPart.replace('v1=', '');

  const payload = \`\${timestamp}.\${JSON.stringify(req.body)}\`;
  const expectedHash = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  if (expectedHash !== receivedHash) {
    throw new Error('Invalid webhook signature');
  }

  // Optional: reject old webhooks (>5 min)
  const age = Math.floor(Date.now() / 1000) - parseInt(timestamp);
  if (age > 300) {
    throw new Error('Webhook timestamp too old');
  }

  return true;
}`}
      />

      <SectionHeading>Limits</SectionHeading>
      <Callout type="info">
        Maximum 5 webhooks per account on the Free plan, 10
        on Pro. Localhost URLs are blocked in production for
        security.
      </Callout>
    </>
  );
}

function AnalyticsContent() {
  return (
    <>
      <Paragraph>
        Track email performance with built-in analytics.
        Monitor delivery rates, open rates, bounces, and
        click activity from the dashboard or API.
      </Paragraph>

      <SectionHeading>Overview Endpoint</SectionHeading>
      <EndpointBadge
        method="GET"
        path="/api/analytics/overview?days=30"
      />
      <Paragraph>
        Returns aggregate metrics for the specified time
        period.
      </Paragraph>
      <ResponseTable
        fields={[
          {
            name: 'total',
            type: 'number',
            description: 'Total emails sent',
          },
          {
            name: 'delivered',
            type: 'number',
            description: 'Successfully delivered',
          },
          {
            name: 'opened',
            type: 'number',
            description: 'Emails opened (tracking pixel)',
          },
          {
            name: 'bounced',
            type: 'number',
            description: 'Bounced emails',
          },
          {
            name: 'complained',
            type: 'number',
            description: 'Marked as spam',
          },
          {
            name: 'failed',
            type: 'number',
            description: 'Failed to send',
          },
          {
            name: 'pending',
            type: 'number',
            description: 'Still processing',
          },
          {
            name: 'deliveryRate',
            type: 'number',
            description:
              'Percentage of successful deliveries',
          },
          {
            name: 'openRate',
            type: 'number',
            description:
              'Percentage of opens (of delivered)',
          },
        ]}
      />
      <CodeBlock
        title="Example response"
        language="json"
        code={`{
  "total": 1250,
  "delivered": 1200,
  "opened": 480,
  "bounced": 35,
  "complained": 2,
  "failed": 13,
  "pending": 0,
  "deliveryRate": 96.0,
  "openRate": 40.0
}`}
      />

      <SectionHeading>Timeline Endpoint</SectionHeading>
      <EndpointBadge
        method="GET"
        path="/api/analytics/timeline?days=30&groupBy=day"
      />
      <ParamTable
        params={[
          {
            name: 'days',
            type: 'number',
            required: false,
            description:
              'Time period in days (default: 30)',
          },
          {
            name: 'groupBy',
            type: 'string',
            required: false,
            description: '"day" or "week" (default: "day")',
          },
        ]}
      />
      <Paragraph>
        Returns time-series data with metrics grouped by day
        or week.
      </Paragraph>

      <SectionHeading>Tracking Features</SectionHeading>

      <SubHeading>Open Tracking</SubHeading>
      <Paragraph>
        A 1×1 invisible tracking pixel is automatically
        injected before the closing{' '}
        <InlineCode>{'</body>'}</InlineCode> tag in HTML
        emails. When the recipient loads images, the open is
        recorded.
      </Paragraph>

      <SubHeading>Click Tracking</SubHeading>
      <Paragraph>
        In batch emails, links are automatically replaced
        with tracked short URLs powered by Shrnk. Click data
        includes total clicks per link and is available in
        the batch detail view.
      </Paragraph>

      <SubHeading>Bounce Handling</SubHeading>
      <Paragraph>
        Bounced email addresses are automatically added to a
        global suppression list. Future sends to bounced
        addresses are blocked to protect your sender
        reputation. You receive a webhook notification with
        bounce details.
      </Paragraph>

      <SubHeading>Unsubscribe Tracking</SubHeading>
      <Paragraph>
        CAN-SPAM compliant unsubscribe links are
        automatically injected into batch emails. When a
        recipient unsubscribes, an{' '}
        <InlineCode>email.unsubscribed</InlineCode> webhook
        event is fired.
      </Paragraph>
    </>
  );
}

function RateLimitsContent() {
  return (
    <>
      <Paragraph>
        FWD enforces plan-based limits to ensure fair usage
        and reliable delivery for all users. Limits reset on
        the 1st of each month (UTC).
      </Paragraph>

      <SectionHeading>Plan Comparison</SectionHeading>
      <div className="overflow-x-auto my-4 rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left py-3 px-4 font-semibold text-foreground">
                Feature
              </th>
              <th className="text-center py-3 px-4 font-semibold text-foreground">
                Free
              </th>
              <th className="text-center py-3 px-4 font-semibold text-primary">
                Pro ($4.99/mo)
              </th>
              <th className="text-center py-3 px-4 font-semibold text-foreground">
                Enterprise
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              [
                'Emails per month',
                '100',
                '5,000',
                'Unlimited',
              ],
              ['Verified domains', '1', '5', 'Unlimited'],
              ['API keys', '3', '10', 'Unlimited'],
              ['Templates', '5', 'Unlimited', 'Unlimited'],
              ['Webhooks', '2', '10', 'Unlimited'],
              [
                'Batch size (per request)',
                '500',
                '500',
                '500',
              ],
            ].map(([feature, free, pro, enterprise], i) => (
              <tr
                key={feature}
                className={
                  i % 2 === 0 ? 'bg-card' : 'bg-muted/10'
                }
              >
                <td className="py-3 px-4 text-foreground font-medium">
                  {feature}
                </td>
                <td className="py-3 px-4 text-center text-muted-foreground">
                  {free}
                </td>
                <td className="py-3 px-4 text-center text-primary font-medium">
                  {pro}
                </td>
                <td className="py-3 px-4 text-center text-muted-foreground">
                  {enterprise}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SectionHeading>Rate Limit Headers</SectionHeading>
      <Paragraph>
        Every email send response includes rate limit
        information in the headers:
      </Paragraph>
      <div className="overflow-x-auto my-4 rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left py-3 px-4 font-semibold text-foreground">
                Header
              </th>
              <th className="text-left py-3 px-4 font-semibold text-foreground">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-card">
              <td className="py-3 px-4 font-mono text-xs text-primary">
                X-RateLimit-Limit
              </td>
              <td className="py-3 px-4 text-muted-foreground">
                Your plan&apos;s monthly email limit
              </td>
            </tr>
            <tr className="bg-muted/10">
              <td className="py-3 px-4 font-mono text-xs text-primary">
                X-RateLimit-Remaining
              </td>
              <td className="py-3 px-4 text-muted-foreground">
                Emails remaining in the current billing
                period
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <SectionHeading>Rate Limit Exceeded</SectionHeading>
      <Paragraph>
        When you exceed your monthly limit, the API returns
        a <InlineCode>429</InlineCode> status:
      </Paragraph>
      <CodeBlock
        title="429 Too Many Requests"
        language="json"
        code={`{
  "error": "Monthly email limit reached (100/month). Upgrade to Pro for 5,000 emails/month."
}`}
      />

      <SectionHeading>Batch Limits</SectionHeading>
      <Paragraph>
        Each batch send request can include a maximum of{' '}
        <strong>500 recipients</strong>. If a batch would
        push you over your monthly limit, the entire batch
        is rejected with a message showing how many emails
        remain.
      </Paragraph>
      <CodeBlock
        title="Batch exceeds remaining quota"
        language="json"
        code={`{
  "error": "Batch would exceed monthly limit. 42 emails remaining."
}`}
      />

      <Callout type="tip" title="Monitor your usage">
        Check your remaining quota via the{' '}
        <InlineCode>X-RateLimit-Remaining</InlineCode>{' '}
        header in API responses, or visit the{' '}
        <Link
          href="/dashboard"
          className="text-primary hover:underline"
        >
          dashboard
        </Link>{' '}
        to see your current usage.
      </Callout>
    </>
  );
}

function ErrorHandlingContent() {
  return (
    <>
      <Paragraph>
        FWD uses standard HTTP status codes and returns
        consistent JSON error responses. This guide covers
        error formats, common codes, and troubleshooting
        steps.
      </Paragraph>

      <SectionHeading>Error Response Format</SectionHeading>
      <Paragraph>
        All error responses follow this format:
      </Paragraph>
      <CodeBlock
        title="Error response"
        language="json"
        code={`{
  "error": "Human-readable error description"
}`}
      />
      <Paragraph>
        Successful responses follow this format (for
        dashboard API routes):
      </Paragraph>
      <CodeBlock
        title="Success response"
        language="json"
        code={`{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}`}
      />

      <SectionHeading>HTTP Status Codes</SectionHeading>
      <div className="overflow-x-auto my-4 rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left py-3 px-4 font-semibold text-foreground">
                Code
              </th>
              <th className="text-left py-3 px-4 font-semibold text-foreground">
                Meaning
              </th>
              <th className="text-left py-3 px-4 font-semibold text-foreground">
                Common Causes
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              [
                '200',
                'Success',
                'Request processed successfully',
              ],
              [
                '201',
                'Created',
                'Resource created (API key, template, webhook)',
              ],
              [
                '400',
                'Bad Request',
                'Missing fields, invalid email format, suppressed recipient, invalid domain format',
              ],
              [
                '401',
                'Unauthorized',
                'Missing, invalid, or revoked API key',
              ],
              [
                '403',
                'Forbidden',
                'Plan limit exceeded (domains, templates)',
              ],
              [
                '404',
                'Not Found',
                'Template, webhook, or email not found',
              ],
              [
                '429',
                'Rate Limited',
                'Monthly email limit reached',
              ],
              [
                '500',
                'Server Error',
                'Internal failure — retry with exponential backoff',
              ],
            ].map(([code, meaning, causes], i) => (
              <tr
                key={code}
                className={
                  i % 2 === 0 ? 'bg-card' : 'bg-muted/10'
                }
              >
                <td className="py-3 px-4">
                  <span
                    className={`font-mono text-xs font-bold ${
                      code.startsWith('2')
                        ? 'text-emerald-500'
                        : code.startsWith('4')
                          ? 'text-amber-500'
                          : 'text-red-500'
                    }`}
                  >
                    {code}
                  </span>
                </td>
                <td className="py-3 px-4 text-foreground font-medium">
                  {meaning}
                </td>
                <td className="py-3 px-4 text-muted-foreground">
                  {causes}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SectionHeading>
        Common Errors & Solutions
      </SectionHeading>

      <SubHeading>Missing API Key</SubHeading>
      <CodeBlock
        title="401 Unauthorized"
        language="json"
        code={`{ "error": "Missing API key. Include x-api-key header." }`}
      />
      <Paragraph>
        <strong>Solution:</strong> Add the{' '}
        <InlineCode>x-api-key</InlineCode> header with your
        API key to every request.
      </Paragraph>

      <SubHeading>Invalid API Key</SubHeading>
      <CodeBlock
        title="401 Unauthorized"
        language="json"
        code={`{ "error": "Invalid or revoked API key" }`}
      />
      <Paragraph>
        <strong>Solution:</strong> Check that your API key
        is correct and has not been revoked. Generate a new
        key from the dashboard if needed.
      </Paragraph>

      <SubHeading>Missing Required Fields</SubHeading>
      <CodeBlock
        title="400 Bad Request"
        language="json"
        code={`{ "error": "Missing fields: to, subject, and html or text required" }`}
      />
      <Paragraph>
        <strong>Solution:</strong> Ensure your request body
        includes <InlineCode>to</InlineCode>,{' '}
        <InlineCode>subject</InlineCode>, and either{' '}
        <InlineCode>html</InlineCode> or{' '}
        <InlineCode>text</InlineCode> (or use{' '}
        <InlineCode>templateId</InlineCode>).
      </Paragraph>

      <SubHeading>Suppressed Recipient</SubHeading>
      <CodeBlock
        title="400 Bad Request"
        language="json"
        code={`{ "error": "Email to user@example.com blocked: recipient is on suppression list (bounce)" }`}
      />
      <Paragraph>
        <strong>Solution:</strong> The recipient&apos;s
        address previously bounced and was added to the
        suppression list. Remove it manually or contact
        support.
      </Paragraph>

      <SubHeading>Unverified Domain</SubHeading>
      <CodeBlock
        title="400 Bad Request"
        language="json"
        code={`{ "error": "Domain 'yourdomain.com' is not verified. Add and verify it in your dashboard first." }`}
      />
      <Paragraph>
        <strong>Solution:</strong> Verify your domain in the{' '}
        <Link
          href="/docs/domains"
          className="text-primary hover:underline"
        >
          Domains
        </Link>{' '}
        section before using it as a custom sender.
      </Paragraph>

      <SectionHeading>Best Practices</SectionHeading>
      <ul className="list-disc pl-6 text-muted-foreground space-y-2 text-sm mb-4">
        <li>
          Always check the HTTP status code before parsing
          the response body
        </li>
        <li>
          Implement exponential backoff for{' '}
          <InlineCode>500</InlineCode> errors (retry after
          1s, 2s, 4s…)
        </li>
        <li>
          Monitor{' '}
          <InlineCode>X-RateLimit-Remaining</InlineCode>{' '}
          headers to avoid hitting limits
        </li>
        <li>
          Log error responses for debugging — the{' '}
          <InlineCode>error</InlineCode> field contains
          actionable details
        </li>
        <li>
          Use webhooks to track delivery status rather than
          polling
        </li>
      </ul>
    </>
  );
}

const contentMap: Record<
  string,
  { title: string; component: React.ComponentType }
> = {
  'getting-started': {
    title: 'Quick Start',
    component: GettingStartedContent,
  },
  'send-email': {
    title: 'Send Email',
    component: SendEmailContent,
  },
  'batch-sending': {
    title: 'Batch Sending',
    component: BatchSendingContent,
  },
  templates: {
    title: 'Templates',
    component: TemplatesContent,
  },
  'api-keys': {
    title: 'API Keys',
    component: ApiKeysContent,
  },
  domains: {
    title: 'Custom Domains',
    component: DomainsContent,
  },
  webhooks: {
    title: 'Webhooks',
    component: WebhooksContent,
  },
  analytics: {
    title: 'Analytics',
    component: AnalyticsContent,
  },
  'rate-limits': {
    title: 'Rate Limits',
    component: RateLimitsContent,
  },
  'error-handling': {
    title: 'Error Handling',
    component: ErrorHandlingContent,
  },
};

export default function DocPage() {
  const params = useParams();
  const slug = params.slug as string;
  const entry = contentMap[slug];

  if (!entry) {
    return (
      <div className="min-h-screen bg-background">
        <Header navLinks={docsNavLinks} />
        <div className="mx-auto max-w-5xl px-6 py-20 text-center">
          <h1 className="text-3xl font-bold mb-4">
            Page not found
          </h1>
          <p className="text-muted-foreground mb-6">
            The documentation page you&apos;re looking for
            doesn&apos;t exist.
          </p>
          <Link
            href="/docs"
            className="text-primary hover:underline"
          >
            ← Back to Documentation
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const Content = entry.component;

  const currentIndex = allDocPages.findIndex(
    (p) => p.slug === slug,
  );
  const prevPage =
    currentIndex > 0 ? allDocPages[currentIndex - 1] : null;
  const nextPage =
    currentIndex < allDocPages.length - 1
      ? allDocPages[currentIndex + 1]
      : null;

  return (
    <div className="min-h-screen bg-background">
      <Header navLinks={docsNavLinks} />

      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col lg:flex-row">
          <DocsSidebar />

          <main className="flex-1 min-w-0 py-8 lg:pl-8 lg:border-l lg:border-border">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
              <Link
                href="/docs"
                className="hover:text-foreground transition-colors"
              >
                Docs
              </Link>
              <span>/</span>
              <span className="text-foreground">
                {entry.title}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              {entry.title}
            </h1>

            {/* Content */}
            <div className="max-w-3xl">
              <Content />
            </div>

            {/* Prev/Next navigation */}
            <div className="flex items-center justify-between mt-16 pt-6 border-t border-border max-w-3xl">
              {prevPage ? (
                <Link
                  href={`/docs/${prevPage.slug}`}
                  className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                  {prevPage.title}
                </Link>
              ) : (
                <div />
              )}
              {nextPage ? (
                <Link
                  href={`/docs/${nextPage.slug}`}
                  className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {nextPage.title}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              ) : (
                <div />
              )}
            </div>
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}
