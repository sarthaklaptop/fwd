import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { templates } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import TemplatesSection from './templates-section';

export default async function TemplatesPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const userTemplates = await db.select().from(templates).where(eq(templates.userId, user.id)).orderBy(desc(templates.createdAt));

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-foreground">Templates</h1>
                <p className="text-muted-foreground">Create and manage reusable email templates</p>
            </div>

            {/* Content */}
            <TemplatesSection initialTemplates={userTemplates} />
        </div>
    );
}
