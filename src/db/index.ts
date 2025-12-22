import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { env } from '@/lib/env';

// Create postgres connection
// Use connection pooling for serverless environments
const connectionString = env.DATABASE_URL;

// For serverless, we need to disable prefetch and prepare
const client = postgres(connectionString, {
  prepare: false,
});

// Create drizzle instance
export const db = drizzle(client, { schema });

