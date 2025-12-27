import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { apiKeys } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import ApiKeysSection from './api-keys-section';

export default async function ApiKeysPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const userApiKeys = await db.select({
        id: apiKeys.id,
        name: apiKeys.name,
        keyPrefix: apiKeys.keyPrefix,
        lastUsedAt: apiKeys.lastUsedAt,
        createdAt: apiKeys.createdAt,
        revokedAt: apiKeys.revokedAt,
    }).from(apiKeys).where(eq(apiKeys.userId, user.id)).orderBy(desc(apiKeys.createdAt));

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">API Keys</h1>
                <p className="text-muted-foreground">Manage your API keys for authentication</p>
            </div>

            <div className="bg-card/50 backdrop-blur-sm rounded-xl border border-border p-6">
                <ApiKeysSection initialKeys={userApiKeys} />
            </div>
        </div>
    );
}
