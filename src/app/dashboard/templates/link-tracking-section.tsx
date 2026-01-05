'use client';

import {
  Link2,
  Link2Off,
  ExternalLink,
} from 'lucide-react';

interface LinkTrackingSectionProps {
  links: string[];
  excludedLinks: Set<string>;
  onToggle: (url: string) => void;
}

export function LinkTrackingSection({
  links,
  excludedLinks,
  onToggle,
}: LinkTrackingSectionProps) {
  if (links.length === 0) {
    return (
      <div className="p-4 border border-border rounded-lg bg-card">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Link2 className="w-4 h-4" />
          <span className="text-sm font-medium">
            Link Tracking
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          No trackable links detected. Add links in your
          HTML to enable click tracking.
        </p>
      </div>
    );
  }

  const trackedCount = links.length - excludedLinks.size;

  return (
    <div className="border border-border rounded-lg bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              Link Tracking
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {trackedCount} of {links.length} tracked
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Tracked links will show click stats in Analytics
        </p>
      </div>

      <div className="divide-y divide-border max-h-[200px] overflow-y-auto">
        {links.map((url) => {
          const isTracked = !excludedLinks.has(url);
          const displayUrl = truncateUrl(url, 50);
          const domain = extractDomain(url);

          return (
            <div
              key={url}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors"
            >
              <button
                type="button"
                onClick={() => onToggle(url)}
                className={`shrink-0 w-8 h-5 rounded-full transition-colors relative ${
                  isTracked ? 'bg-primary' : 'bg-muted'
                }`}
                aria-label={
                  isTracked
                    ? 'Disable tracking'
                    : 'Enable tracking'
                }
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                    isTracked ? 'left-3.5' : 'left-0.5'
                  }`}
                />
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {isTracked ? (
                    <Link2 className="w-3.5 h-3.5 text-primary shrink-0" />
                  ) : (
                    <Link2Off className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  )}
                  <span
                    className={`text-sm truncate ${
                      isTracked
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                    }`}
                    title={url}
                  >
                    {displayUrl}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {domain}
                </span>
              </div>

              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 p-1 text-muted-foreground hover:text-foreground transition-colors"
                title="Open link"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function truncateUrl(
  url: string,
  maxLength: number
): string {
  if (url.length <= maxLength) return url;
  return url.slice(0, maxLength - 3) + '...';
}

function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return url;
  }
}

export function extractLinksFromHtml(
  html: string
): string[] {
  if (!html) return [];

  const regex = /href=["'](https?:\/\/[^"']+)["']/gi;
  const matches = [...html.matchAll(regex)];
  const urls = matches.map((m) => m[1]);

  return [...new Set(urls)].filter(
    (url) =>
      !url.includes('/unsubscribe') &&
      !url.includes('/api/track/') &&
      !url.includes('mailto:') &&
      !url.startsWith('#')
  );
}

export function getExcludedLinksFromHtml(
  html: string
): Set<string> {
  if (!html) return new Set();

  // Match links that have data-no-track attribute
  const regex =
    /<a\s+[^>]*data-no-track[^>]*href=["'](https?:\/\/[^"']+)["'][^>]*>|<a\s+[^>]*href=["'](https?:\/\/[^"']+)["'][^>]*data-no-track[^>]*>/gi;
  const matches = [...html.matchAll(regex)];
  const urls = matches
    .map((m) => m[1] || m[2])
    .filter(Boolean);

  return new Set(urls);
}

export function updateHtmlWithExclusions(
  html: string,
  allLinks: string[],
  excludedLinks: Set<string>
): string {
  let result = html;

  for (const url of allLinks) {
    const isExcluded = excludedLinks.has(url);
    const escapedUrl = url.replace(
      /[.*+?^${}()|[\]\\]/g,
      '\\$&'
    );

    if (isExcluded) {
      // Add data-no-track if not already present
      // Match <a ... href="url" ...> without data-no-track and add it
      const withoutNoTrack = new RegExp(
        `(<a\\s+)(?![^>]*data-no-track)([^>]*href=["']${escapedUrl}["'][^>]*)>`,
        'gi'
      );
      result = result.replace(
        withoutNoTrack,
        '$1data-no-track $2>'
      );
    } else {
      // Remove data-no-track if present
      const withNoTrack = new RegExp(
        `(<a\\s+)data-no-track\\s*([^>]*href=["']${escapedUrl}["'][^>]*)>`,
        'gi'
      );
      result = result.replace(withNoTrack, '$1$2>');

      // Also handle when data-no-track comes after href
      const withNoTrackAfter = new RegExp(
        `(<a\\s+[^>]*href=["']${escapedUrl}["'][^>]*)\\s*data-no-track([^>]*)>`,
        'gi'
      );
      result = result.replace(withNoTrackAfter, '$1$2>');
    }
  }

  return result;
}
