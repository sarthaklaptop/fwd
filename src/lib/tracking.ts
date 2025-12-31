import { getUnsubscribeUrl } from './unsubscribe';

/**
 * Injects a 1x1 tracking pixel into HTML email content before </body>.
 */
export function injectOpenTracking(
  html: string,
  emailId: string,
  baseUrl: string
): string {
  const pixel = `<img src="${baseUrl}/api/track/open/${emailId}" width="1" height="1" style="display:none" alt="" />`;

  if (html.includes('</body>')) {
    return html.replace('</body>', `${pixel}</body>`);
  }
  return html + pixel;
}

/**
 * Injects an unsubscribe link footer into HTML email content.
 */
export function injectUnsubscribeLink(
  html: string,
  emailId: string,
  to: string,
  userId: string,
  baseUrl: string
): string {
  const unsubUrl = getUnsubscribeUrl(
    emailId,
    to,
    userId,
    baseUrl
  );

  const unsubscribeBlock = `
    <div style="text-align:center;padding:20px;margin-top:20px;border-top:1px solid #eee;font-size:12px;color:#666;font-family:Arial,sans-serif;">
      <a href="${unsubUrl}" style="color:#666;text-decoration:underline;">Unsubscribe</a> from these emails
    </div>
  `;

  if (html.includes('</body>')) {
    return html.replace(
      '</body>',
      `${unsubscribeBlock}</body>`
    );
  }
  return html + unsubscribeBlock;
}

/**
 * Generates List-Unsubscribe header value for email clients.
 * This makes Gmail/Outlook show an "Unsubscribe" button at the top of the email.
 */
export function getListUnsubscribeHeader(
  emailId: string,
  to: string,
  userId: string,
  baseUrl: string
): string {
  const url = getUnsubscribeUrl(
    emailId,
    to,
    userId,
    baseUrl
  );
  return `<${url}>`;
}

/**
 * Extract all unique HTTP(S) links from HTML content.
 * Excludes unsubscribe links and tracking pixels.
 */
export function extractLinks(html: string): string[] {
  const regex = /href=["'](https?:\/\/[^"']+)["']/gi;
  const matches = [...html.matchAll(regex)];
  const urls = matches.map((m) => m[1]);

  // Dedupe and filter out internal tracking/unsubscribe links
  return [...new Set(urls)].filter(
    (url) =>
      !url.includes('/unsubscribe') &&
      !url.includes('/api/track/') &&
      !url.includes('mailto:')
  );
}

/**
 * Replace original links with tracked short URLs.
 * @param html - Original HTML content
 * @param linkMap - Map of originalUrl -> shortUrl
 */
export function injectTrackedLinks(
  html: string,
  linkMap: Map<string, string>
): string {
  let result = html;

  for (const [original, short] of linkMap) {
    // Replace both double and single quoted hrefs
    result = result.replaceAll(
      `href="${original}"`,
      `href="${short}"`
    );
    result = result.replaceAll(
      `href='${original}'`,
      `href='${short}'`
    );
  }

  return result;
}
