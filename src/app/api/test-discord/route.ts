import { NextResponse } from 'next/server';
import { notifyAdmin } from '@/lib/discord';

/**
 * Test endpoint for Discord notifications
 * GET /api/test-discord
 *
 * Only works in development mode
 */
export async function GET() {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 403 },
    );
  }

  const webhookUrl = process.env.DISCORD_ADMIN_WEBHOOK;

  if (!webhookUrl) {
    return NextResponse.json(
      {
        error:
          'DISCORD_ADMIN_WEBHOOK not configured in .env',
      },
      { status: 400 },
    );
  }

  try {
    // Send test notification
    const success = await notifyAdmin({
      title: '🧪 Test Notification',
      message: 'Discord integration is working! 🎉',
      color: 'success',
      fields: [
        { name: 'Environment', value: 'Development' },
        {
          name: 'Time',
          value: new Date().toLocaleString(),
        },
      ],
    });

    if (success) {
      return NextResponse.json({
        success: true,
        message:
          'Test notification sent! Check your Discord channel.',
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to send notification' },
        { status: 500 },
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to send notification',
        details: String(error),
      },
      { status: 500 },
    );
  }
}
