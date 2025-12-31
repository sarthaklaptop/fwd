const SHRNK_API_URL =
  process.env.SHRNK_API_URL || 'https://shrnk.app/api';
const SHRNK_API_KEY = process.env.SHRNK_API_KEY || '';

// Types

interface ShrnkLinkMetadata {
  source: 'fwd';
  batchId: string;
  userId: string;
  emailId?: string;
}

interface ShrnkLinkRequest {
  url: string;
  metadata: ShrnkLinkMetadata;
}

interface ShrnkLinkResponse {
  id: string;
  originalUrl: string;
  shortUrl: string;
  shortCode: string;
}

interface ShrnkBulkResponse {
  success: boolean;
  data: {
    links: ShrnkLinkResponse[];
  };
}

interface ShrnkLinkStats {
  id: string;
  originalUrl: string;
  clickCount: number;
  firstClickedAt: string | null;
  lastClickedAt: string | null;
}

interface ShrnkStatsResponse {
  success: boolean;
  data: {
    batchId: string;
    totalLinks: number;
    totalClicks: number;
    uniqueClickedEmails: number;
    topLinks: Array<{ url: string; clicks: number }>;
    links?: ShrnkLinkStats[];
  };
}

export async function createBulkLinks(
  links: ShrnkLinkRequest[]
): Promise<ShrnkLinkResponse[]> {
  if (!SHRNK_API_KEY) {
    console.warn(
      '⚠️ SHRNK_API_KEY not configured, skipping link tracking'
    );
    return [];
  }

  if (links.length === 0) {
    return [];
  }

  try {
    const res = await fetch(`${SHRNK_API_URL}/links/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SHRNK_API_KEY}`,
      },
      body: JSON.stringify({ links }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(
        `Shrnk bulk API error: ${res.status} - ${errorText}`
      );
      throw new Error(`Shrnk API error: ${res.status}`);
    }

    const data: ShrnkBulkResponse = await res.json();
    return data.data.links;
  } catch (error) {
    console.error('Failed to create Shrnk links:', error);
    return [];
  }
}

export async function getLinkStats(
  batchId: string
): Promise<ShrnkStatsResponse['data'] | null> {
  if (!SHRNK_API_KEY) {
    console.warn(
      '⚠️ SHRNK_API_KEY not configured, cannot fetch link stats'
    );
    return null;
  }

  try {
    const res = await fetch(
      `${SHRNK_API_URL}/links/stats?batchId=${batchId}`,
      {
        headers: {
          Authorization: `Bearer ${SHRNK_API_KEY}`,
        },
      }
    );

    if (!res.ok) {
      console.error(`Shrnk stats API error: ${res.status}`);
      return null;
    }

    const data: ShrnkStatsResponse = await res.json();
    return data.data;
  } catch (error) {
    console.error('Failed to fetch Shrnk stats:', error);
    return null;
  }
}

export function prepareLinksForShrnk(
  urls: string[],
  batchId: string,
  userId: string
): ShrnkLinkRequest[] {
  return urls.map((url) => ({
    url,
    metadata: {
      source: 'fwd' as const,
      batchId,
      userId,
    },
  }));
}

export type {
  ShrnkLinkRequest,
  ShrnkLinkResponse,
  ShrnkLinkMetadata,
  ShrnkStatsResponse,
};
