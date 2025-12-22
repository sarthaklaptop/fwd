import { z } from 'zod';

/**
 * Environment variables schema with Zod validation.
 * Validates all required environment variables at import time.
 * Throws descriptive errors if any are missing or invalid.
 */
const envSchema = z.object({
    // Database
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

    // AWS SES
    AWS_ACCESS_KEY_ID: z.string().min(1, 'AWS_ACCESS_KEY_ID is required'),
    AWS_SECRET_ACCESS_KEY: z.string().min(1, 'AWS_SECRET_ACCESS_KEY is required'),
    AWS_REGION: z.string().default('us-east-1'),
    SES_FROM_EMAIL: z.string().email().optional(),

    // Supabase
    NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),

    // QStash (required for production)
    QSTASH_URL: z.string().url().optional(),
    QSTASH_TOKEN: z.string().optional(),
    QSTASH_CURRENT_SIGNING_KEY: z.string().optional(),
    QSTASH_NEXT_SIGNING_KEY: z.string().optional(),

    // App
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
    VERCEL: z.string().optional(), // Set automatically on Vercel
});

// Parse and validate environment variables
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    const errors = parsed.error.flatten().fieldErrors;
    for (const [key, messages] of Object.entries(errors)) {
        console.error(`  ${key}: ${messages?.join(', ')}`);
    }
    throw new Error('Invalid environment variables. Check the console for details.');
}

export const env = parsed.data;

// Type export for TypeScript autocomplete
export type Env = z.infer<typeof envSchema>;
