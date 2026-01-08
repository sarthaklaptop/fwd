<p align="center">
  <img src="https://img.shields.io/badge/Fwd-Email%20Infrastructure-E11D48?style=for-the-badge&logo=mail.ru&logoColor=white" alt="Fwd" />
</p>

<h1 align="center">📬 Fwd</h1>

<p align="center">
  <strong>The email API for developers who care about infrastructure.</strong>
</p>

<p align="center">
  <a href="#features"><img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="#features"><img src="https://img.shields.io/badge/Next.js%2014-000000?style=flat-square&logo=next.js&logoColor=white" alt="Next.js" /></a>
  <a href="#features"><img src="https://img.shields.io/badge/Redis-DC382D?style=flat-square&logo=redis&logoColor=white" alt="Redis" /></a>
  <a href="#features"><img src="https://img.shields.io/badge/AWS%20SES-FF9900?style=flat-square&logo=amazon-aws&logoColor=white" alt="AWS SES" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License" /></a>
  <a href="#"><img src="https://img.shields.io/badge/Build-Passing-brightgreen?style=flat-square" alt="Build Status" /></a>
</p>

<p align="center">
  <a href="#-architecture">Architecture</a> •
  <a href="#-key-features">Features</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-api-reference">API</a> •
  <a href="#-system-design-highlights">System Design</a>
</p>

---

## 🎯 Introduction

**Fwd** is a high-performance, self-hosted transactional email infrastructure designed for developers who want complete control over their email delivery pipeline. Think of it as your own Resend or SendGrid — but open-source, transparent, and built on battle-tested infrastructure.

> 💡 **Why Fwd?** Instead of black-boxing email delivery, Fwd gives you visibility into every step: from API ingestion to queue processing, delivery, and feedback loops.

Fwd abstracts the complexity of AWS SES into a clean, developer-friendly REST API while providing built-in analytics for opens, clicks, bounces, and complaints. It's not just another CRUD application — it's a **system design showcase** demonstrating real-world patterns like asynchronous processing, producer-consumer queues, and event-driven architectures.

---

## 🏗️ Architecture

Fwd is built with reliability at its core. The architecture decouples request handling from email delivery, ensuring your API remains responsive even under heavy load.

```mermaid
flowchart LR
    subgraph Client Layer
        SDK["📦 Client SDK"]
        REST["🌐 REST Client"]
    end

    subgraph Fwd Core
        API["⚡ API Route\n/api/send"]
        QUEUE[("🔴 Redis Queue\n(BullMQ)")]
        WORKER["⚙️ Worker\nProcessor"]
        DB[("🐘 PostgreSQL\n(Drizzle ORM)")]
    end

    subgraph AWS Infrastructure
        SES["📧 AWS SES"]
        SNS["🔔 AWS SNS"]
    end

    subgraph Recipient
        INBOX["📬 User Inbox"]
    end

    subgraph Feedback Loop
        WEBHOOK["🔄 Webhook Handler\n/api/webhooks/ses"]
    end

    SDK --> API
    REST --> API
    API -->|"Enqueue Job"| QUEUE
    API -->|"Log Request"| DB
    QUEUE -->|"Dequeue"| WORKER
    WORKER -->|"Send Email"| SES
    SES --> INBOX

    SES -->|"Delivery Events"| SNS
    SNS -->|"Bounce/Complaint\nNotifications"| WEBHOOK
    WEBHOOK -->|"Update Status"| DB

    style SDK fill:#3b82f6,stroke:#1d4ed8,color:#fff
    style REST fill:#3b82f6,stroke:#1d4ed8,color:#fff
    style API fill:#10b981,stroke:#059669,color:#fff
    style QUEUE fill:#ef4444,stroke:#dc2626,color:#fff
    style WORKER fill:#f59e0b,stroke:#d97706,color:#fff
    style DB fill:#6366f1,stroke:#4f46e5,color:#fff
    style SES fill:#ff9900,stroke:#cc7a00,color:#fff
    style SNS fill:#ff9900,stroke:#cc7a00,color:#fff
    style INBOX fill:#8b5cf6,stroke:#7c3aed,color:#fff
    style WEBHOOK fill:#ec4899,stroke:#db2777,color:#fff
```

### Data Flow

1. **Ingestion** — Client sends email payload to the API
2. **Queueing** — Request is validated and pushed to Redis (BullMQ)
3. **Processing** — Worker picks up the job, injects tracking, and sends via SES
4. **Delivery** — AWS SES delivers to the recipient's inbox
5. **Feedback** — AWS SNS pushes delivery events back to Fwd for analytics

---

## ✨ Key Features

### 🛡️ Fault Tolerance

> **Problem:** Direct API-to-SES calls can fail under load, causing dropped emails.  
> **Solution:** Redis-backed queues with automatic retries and exponential backoff.

```
High Traffic → API → Queue (Buffer) → Worker → SES
                        ↓
              Jobs persist even if
              workers crash
```

- **Automatic Retries** — Failed jobs retry with configurable backoff
- **Persistence** — Jobs survive server restarts
- **Concurrency Control** — Process multiple emails without overwhelming SES limits

### 📊 Smart Tracking

Fwd automatically instruments your emails for analytics:

| Feature                | How It Works                                     |
| ---------------------- | ------------------------------------------------ |
| **Open Tracking**      | Injects a 1x1 transparent tracking pixel         |
| **Click Tracking**     | Rewrites URLs through Fwd's redirect endpoint    |
| **Bounce Handling**    | Captures SES bounce notifications via SNS        |
| **Complaint Tracking** | Logs spam complaints for deliverability insights |

### 🌐 Custom Sender Domains

Enhance deliverability with verified sender domains:

| Feature                 | Description                                              |
| ----------------------- | -------------------------------------------------------- |
| **Domain Verification** | AWS SES DKIM integration with auto-generated DNS records |
| **Custom From Address** | Send as `hello@yourdomain.com` instead of system email   |
| **SPF/DKIM Signing**    | Improve inbox placement with proper authentication       |
| **Domain Limit**        | Up to 5 verified domains per account                     |

### 🧑‍💻 Developer Experience

- **Typed SDK** — Full TypeScript support with autocomplete
- **Intuitive REST API** — Simple, predictable endpoints
- **Webhook Events** — Real-time event streaming for integrations
- **Dashboard UI** — Built-in monitoring for campaigns, templates, and domains

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following:

| Requirement | Version | Purpose   |
| ----------- | ------- | --------- |
| Node.js     | ≥ 18.x  | Runtime   |
| Redis       | ≥ 7.x   | Job Queue |
| PostgreSQL  | ≥ 15.x  | Database  |
| AWS Account | —       | SES & SNS |

### Environment Variables

Create a `.env.local` file in your project root:

```env
# ═══════════════════════════════════════════════════════
# 🔐 AWS Configuration
# ═══════════════════════════════════════════════════════
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1

# ═══════════════════════════════════════════════════════
# 🔴 Redis Configuration
# ═══════════════════════════════════════════════════════
REDIS_URL=redis://localhost:6379

# ═══════════════════════════════════════════════════════
# 🐘 Database Configuration
# ═══════════════════════════════════════════════════════
DATABASE_URL=postgresql://user:password@localhost:5432/fwd

# ═══════════════════════════════════════════════════════
# 🌐 Application
# ═══════════════════════════════════════════════════════
NEXT_PUBLIC_APP_URL=http://localhost:3000
FWD_API_KEY=your_secret_api_key

# ═══════════════════════════════════════════════════════
# 📧 Email Configuration
# ═══════════════════════════════════════════════════════
SES_FROM_EMAIL=noreply@yourdomain.com
```

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/fwd.git
cd fwd

# 2. Install dependencies
npm install

# 3. Start Redis (using Docker)
docker run -d --name fwd-redis -p 6379:6379 redis:alpine

# 4. Start PostgreSQL (using Docker)
docker run -d --name fwd-postgres \
  -e POSTGRES_USER=user \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=fwd \
  -p 5432:5432 postgres:15-alpine

# 5. Run database migrations
npm run db:migrate

# 6. Start the development server
npm run dev
```

Your Fwd instance is now running at `http://localhost:3000` 🎉

---

## 📖 API Reference

### Send Email

Send a transactional email through the Fwd pipeline.

```
POST /api/send
```

#### Request Headers

| Header          | Type     | Required | Description                          |
| --------------- | -------- | -------- | ------------------------------------ |
| `Authorization` | `string` | ✅       | Bearer token: `Bearer <FWD_API_KEY>` |
| `Content-Type`  | `string` | ✅       | Must be `application/json`           |

#### Request Body

```json
{
  "from": "Acme Inc <hello@verified-domain.com>",
  "to": ["user@example.com"],
  "subject": "Welcome to Acme! 🚀",
  "html": "<h1>Hello World</h1><p>Thanks for signing up!</p>",
  "text": "Hello World\n\nThanks for signing up!",
  "tags": ["onboarding", "welcome"],
  "metadata": {
    "userId": "usr_123",
    "campaign": "launch-2024"
  }
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "id": "msg_a1b2c3d4e5f6",
    "status": "queued",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### Status Codes

| Code  | Description                |
| ----- | -------------------------- |
| `200` | Email successfully queued  |
| `400` | Invalid request body       |
| `401` | Missing or invalid API key |
| `429` | Rate limit exceeded        |
| `500` | Internal server error      |

#### cURL Example

```bash
curl -X POST http://localhost:3000/api/send \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "hello@yourdomain.com",
    "to": ["recipient@example.com"],
    "subject": "Test Email",
    "html": "<p>This is a test email from Fwd.</p>"
  }'
```

---

## 🧠 System Design Highlights

> _This section explains the architectural decisions for technical reviewers and recruiters._

### Why Redis + BullMQ?

| Challenge            | Solution                                                    |
| -------------------- | ----------------------------------------------------------- |
| **Traffic Spikes**   | Queue absorbs bursts; workers process at a sustainable rate |
| **Network Failures** | Jobs persist in Redis; automatic retry with backoff         |
| **Decoupling**       | API responds instantly; heavy lifting happens async         |
| **Observability**    | BullMQ provides job status, progress, and failure logs      |

```
Without Queue:  Client → API → SES (blocks)     → Response
With Queue:     Client → API → Queue → Response (instant)
                                  ↓
                              Worker → SES (async)
```

### Why AWS SES Over SMTP?

| Feature            | AWS SES                     | Traditional SMTP     |
| ------------------ | --------------------------- | -------------------- |
| **Deliverability** | Enterprise-grade reputation | Depends on server    |
| **Scalability**    | 50,000+ emails/sec          | Limited by server    |
| **Feedback Loops** | Native SNS integration      | Manual setup         |
| **Cost**           | $0.10 per 1,000 emails      | Server + maintenance |

### Why Tracking Pixel & Link Rewriting?

Traditional email providers hide their tracking implementation. Fwd makes it transparent:

```
Original:   <a href="https://example.com">Click</a>
Rewritten:  <a href="https://fwd.app/r/abc123">Click</a>
                              ↓
                    Logs click + redirects to original
```

- **Privacy-Respecting** — You control the data
- **Real-Time Analytics** — Instant event callbacks
- **Customizable** — Opt-out tracking per email

### Why Next.js 14 App Router?

| Benefit               | Implementation                                  |
| --------------------- | ----------------------------------------------- |
| **API Routes**        | Colocated with frontend for rapid iteration     |
| **Server Components** | Dashboard renders on server for performance     |
| **Edge Ready**        | API routes can deploy to edge for lower latency |
| **Type Safety**       | End-to-end TypeScript from API to client        |

---

## 📈 Roadmap

- [x] Core email sending pipeline
- [x] Redis queue integration
- [x] Open & click tracking
- [x] AWS SNS webhook handling
- [x] Dashboard UI for campaigns & analytics
- [x] PostgreSQL + Drizzle ORM integration
- [x] Rate limiting per API key
- [x] Email templates management
- [x] Custom domain verification (DKIM/SPF)
- [x] Custom sender email addresses
- [ ] Multi-tenant support
- [ ] Billing & subscription tiers

---

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) before submitting a PR.

```bash
# Fork the repo, then:
git checkout -b feature/your-feature
npm run test
git commit -m "feat: add your feature"
git push origin feature/your-feature
```

---

<p align="center">
  <strong>Built with ☕ and a passion for infrastructure</strong>
</p>

<p align="center">
  <a href="https://github.com/sarthaklaptop/fwd">⭐ Star this repo</a> •
  <a href="https://twitter.com/Sarthak10007">🐦 Follow updates</a>
</p>
