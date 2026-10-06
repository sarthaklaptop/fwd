import 'server-only';
import { SendEmailCommand } from '@aws-sdk/client-ses';
import { ses } from '@/lib/ses';
import {
  injectOpenTracking,
  injectUnsubscribeLink,
} from '@/lib/tracking';

export interface DeliverEmailInput {
  emailId: string;
  to: string | string[];
  subject: string;
  html?: string | null;
  text?: string | null;
  // Already validated SES Source (see resolveSender)
  fromEmail: string;
  replyTo?: string | null;
  // Owner of the email, used for the unsubscribe link
  userId?: string | null;
}

/**
 * Add open tracking and the unsubscribe footer, then send through SES.
 * Throws the SES error on failure so callers can classify it.
 */
export async function deliverEmail(
  input: DeliverEmailInput,
): Promise<{ messageId: string | undefined }> {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  let processedHtml = input.html ?? undefined;
  if (processedHtml) {
    processedHtml = injectOpenTracking(
      processedHtml,
      input.emailId,
      baseUrl,
    );
    if (input.userId) {
      processedHtml = injectUnsubscribeLink(
        processedHtml,
        input.emailId,
        Array.isArray(input.to) ? input.to[0] : input.to,
        input.userId,
        baseUrl,
      );
    }
  }

  // Configuration set enables bounce/complaint tracking
  const response = await ses.send(
    new SendEmailCommand({
      Source: input.fromEmail,
      Destination: {
        ToAddresses: Array.isArray(input.to) ? input.to : [input.to],
      },
      ReplyToAddresses: input.replyTo ? [input.replyTo] : undefined,
      Message: {
        Subject: { Data: input.subject },
        Body: {
          Html: processedHtml ? { Data: processedHtml } : undefined,
          Text: input.text ? { Data: input.text } : undefined,
        },
      },
      ConfigurationSetName: 'fwd-notifications',
    }),
  );

  return { messageId: response.MessageId };
}
