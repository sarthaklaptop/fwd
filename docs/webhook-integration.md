# Webhook Integration Guide

Webhooks allow your application to receive real-time notifications about email events (sent, delivered, opened, bounced, complained). This enables you to build reactive features like:

- **Disable accounts** immediately when an email bounces.
- **Trigger next steps** in a drip campaign when an email is opened.
- **Log security alerts** on spam complaints.

## 1. Supported Events

| Event Type | Description |
|------------|-------------|
| `email.sent` | Email has been accepted by the queue and sent to the provider. |
| `email.delivered` | Email successfully reached the recipient's mail server. |
| `email.opened` | Recipient opened the email (requires HTML emails). |
| `email.bounced` | Delivery failed (soft or hard bounce). |
| `email.complained` | Recipient marked the email as spam. |

## 2. Payload Structure

FWD sends a `POST` request to your configured URL with a JSON body.

### Success Example (`email.sent`, `email.opened`)
```json
{
  "emailId": "550e8400-e29b-41d4-a716-446655440000",
  "to": "user@example.com",
  "templateId": "optional-template-uuid",
  "timestamp": "2025-12-23T10:30:00.000Z",
  "userId": "user_123"
}
```

### Failure Example (`email.bounced`)
```json
{
  "emailId": "550e8400-e29b-41d4-a716-446655440000",
  "bounceType": "Permanent",
  "recipients": ["failed@example.com"],
  "timestamp": "2025-12-23T10:35:00.000Z"
}
```

## 3. Securing Webhooks

To ensure requests originate from FWD and not a malicious actor, verify the `X-Fwd-Signature` header.

### Header Format
`X-Fwd-Signature: t=1703328000,v1=5b2...`

- `t`: Timestamp (seconds since epoch)
- `v1`: HMAC-SHA256 signature

### Implementation Example (Node.js / Express)

```javascript
const crypto = require('crypto');
const express = require('express');
const app = express();

// 1. You needs the raw body for signature verification
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

const SIGNING_SECRET = 'whsec_...'; // Get this from FWD Dashboard

app.post('/webhooks/fwd', (req, res) => {
  const signature = req.headers['x-fwd-signature'];
  if (!signature) return res.status(400).send('Missing signature');

  const [t, v1] = signature.split(',').map(p => p.split('=')[1]);
  
  // 2. Prevent Replay Attacks (reject requests > 5 mins old)
  const now = Math.floor(Date.now() / 1000);
  if (now - parseInt(t) > 300) {
    return res.status(400).send('Request too old');
  }

  // 3. Compute Expected Signature
  // Format: timestamp.payload_json_string
  const payload = `${t}.${JSON.stringify(req.body)}`;
  
  const expectedSignature = crypto
    .createHmac('sha256', SIGNING_SECRET)
    .update(payload)
    .digest('hex');

  // 4. Constant-Time Comparison
  if (expectedSignature !== v1) {
    return res.status(401).send('Invalid signature');
  }

  // 5. Process Event
  const event = req.body;
  
  if (event.eventType === 'email.bounced') {
    console.log(`Deactivating user ${event.to} due to bounce`);
    // await db.users.update({ active: false, where: { email: event.to } });
  }

  res.json({ received: true });
});

app.listen(3000, () => console.log('Listening for webhooks on port 3000'));
```

## 4. Best Practices

- **Idempotency**: Webhooks may occasionally be sent more than once. Use the `emailId` or `timestamp` to prevent processing the same event twice.
- **Respond Quickly**: Return a 200 OK immediately and process complex logic (like updating databases) asynchronously.
- **CSRF Protection**: Webhook endpoints are public APIs; exclude them from CSRF protection middleware in frameworks like Rails or Django.
