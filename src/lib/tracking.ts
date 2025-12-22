/**
 * Injects a 1x1 tracking pixel into HTML email content before </body>.
 */
export function injectOpenTracking(html: string, emailId: string, baseUrl: string): string {
    const pixel = `<img src="${baseUrl}/api/track/open/${emailId}" width="1" height="1" style="display:none" alt="" />`;

    if (html.includes('</body>')) {
        return html.replace('</body>', `${pixel}</body>`);
    }
    return html + pixel;
}

