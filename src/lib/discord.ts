/**
 * Admin Discord Notifications
 *
 * Send alerts to admin Discord channel for platform events.
 * Configure DISCORD_ADMIN_WEBHOOK in .env to enable.
 */

interface NotificationPayload {
  title: string;
  message: string;
  color?: 'success' | 'warning' | 'error' | 'info';
  fields?: { name: string; value: string }[];
}

// Discord embed colors (decimal format)
const COLORS = {
  success: 0x00ff00, // Green
  warning: 0xffaa00, // Orange
  error: 0xff4444, // Red
  info: 0x5865f2, // Discord blue
} as const;

/**
 * Send a notification to the admin Discord channel
 */
export async function notifyAdmin(
  payload: NotificationPayload,
): Promise<boolean> {
  const webhookUrl = process.env.DISCORD_ADMIN_WEBHOOK;

  if (!webhookUrl) {
    // Silently skip if not configured
    return false;
  }

  try {
    const color = COLORS[payload.color || 'info'];

    const body = {
      embeds: [
        {
          title: payload.title,
          description: payload.message,
          color,
          fields: payload.fields?.map((f) => ({
            name: f.name,
            value: f.value,
            inline: true,
          })),
          timestamp: new Date().toISOString(),
          footer: {
            text: 'FWD Admin Alerts',
          },
        },
      ],
    };

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.error(
        `Discord webhook failed: ${res.status}`,
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error(
      'Failed to send Discord notification:',
      error,
    );
    return false;
  }
}

// ============================================
// Pre-built notification helpers
// ============================================

export async function notifyBounce(
  email: string,
  bounceType: string,
  userId?: string,
) {
  await notifyAdmin({
    title: '⚠️ Email Bounced',
    message: `Email to \`${email}\` bounced`,
    color: 'warning',
    fields: [
      { name: 'Type', value: bounceType },
      ...(userId
        ? [
            {
              name: 'User ID',
              value: userId.slice(0, 8) + '...',
            },
          ]
        : []),
    ],
  });
}

export async function notifyComplaint(
  email: string,
  userId?: string,
) {
  await notifyAdmin({
    title: '🚨 Spam Complaint',
    message: `Spam complaint received for \`${email}\``,
    color: 'error',
    fields: userId
      ? [
          {
            name: 'User ID',
            value: userId.slice(0, 8) + '...',
          },
        ]
      : [],
  });
}

export async function notifyCampaignComplete(
  batchId: string,
  stats: {
    total: number;
    sent: number;
    failed: number;
    suppressed?: number;
  },
) {
  const status =
    stats.failed === 0
      ? '✅'
      : stats.sent === 0
        ? '❌'
        : '⚠️';
  const statusText =
    stats.failed === 0
      ? 'Complete'
      : stats.sent === 0
        ? 'Failed'
        : 'Partial';

  await notifyAdmin({
    title: `${status} Campaign ${statusText}`,
    message: `Batch \`${batchId.slice(0, 8)}...\``,
    color:
      stats.failed === 0
        ? 'success'
        : stats.sent === 0
          ? 'error'
          : 'warning',
    fields: [
      { name: 'Total', value: stats.total.toString() },
      { name: 'Sent', value: stats.sent.toString() },
      { name: 'Failed', value: stats.failed.toString() },
      ...(stats.suppressed
        ? [
            {
              name: 'Suppressed',
              value: stats.suppressed.toString(),
            },
          ]
        : []),
    ],
  });
}

export async function notifyNewUser(email: string) {
  await notifyAdmin({
    title: '👤 New User Signup',
    message: `\`${email}\` just signed up!`,
    color: 'info',
  });
}

export async function notifyNewSubscription(
  email: string,
  plan: string,
) {
  await notifyAdmin({
    title: '💰 New Subscription',
    message: `\`${email}\` upgraded to **${plan}**!`,
    color: 'success',
    fields: [{ name: 'Plan', value: plan }],
  });
}

export async function notifyError(
  context: string,
  error: string,
) {
  await notifyAdmin({
    title: '🔴 Error',
    message: `Error in \`${context}\``,
    color: 'error',
    fields: [
      { name: 'Details', value: error.slice(0, 1000) },
    ],
  });
}
