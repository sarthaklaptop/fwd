import { pgTable, uuid, varchar, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';

// Email status enum
export const emailStatusEnum = pgEnum('email_status', [
  'pending',     // Created, not yet sent to QStash
  'processing',  // QStash received, webhook processing
  'completed',   // SES accepted the email
  'failed'       // Permanent failure after retries
]);

// Users table - stores user profiles synced with Supabase Auth
export const users = pgTable('users', {
  id: uuid('id').primaryKey(), // Same as Supabase Auth user ID
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Emails table
export const emails = pgTable('emails', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id), // Foreign key to users
  to: varchar('to', { length: 255 }).notNull(),
  subject: varchar('subject', { length: 500 }).notNull(),
  html: text('html'),
  text: text('text'),
  status: emailStatusEnum('status').default('pending').notNull(),
  messageId: varchar('message_id', { length: 255 }),  // QStash message ID
  sesMessageId: varchar('ses_message_id', { length: 255 }),  // SES response
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Type inference
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Email = typeof emails.$inferSelect;
export type NewEmail = typeof emails.$inferInsert;
