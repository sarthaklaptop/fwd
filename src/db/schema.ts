import { pgTable, uuid, varchar, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';

// Email status enum
export const emailStatusEnum = pgEnum('email_status', [
  'pending',
  'processing',
  'completed',
  'failed',
  'bounced',
  'complained'
]);

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// API Keys table
export const apiKeys = pgTable('api_keys', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  keyHash: varchar('key_hash', { length: 64 }).notNull().unique(),
  keyPrefix: varchar('key_prefix', { length: 12 }).notNull(),
  lastUsedAt: timestamp('last_used_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  revokedAt: timestamp('revoked_at'),
});

// Suppression list - emails that should not receive messages
export const suppressionList = pgTable('suppression_list', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull(),
  reason: varchar('reason', { length: 50 }).notNull(),
  userId: uuid('user_id').references(() => users.id),
  emailId: uuid('email_id').references(() => emails.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Emails table
export const emails = pgTable('emails', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  to: varchar('to', { length: 255 }).notNull(),
  subject: varchar('subject', { length: 500 }).notNull(),
  html: text('html'),
  text: text('text'),
  status: emailStatusEnum('status').default('pending').notNull(),
  messageId: varchar('message_id', { length: 255 }),
  sesMessageId: varchar('ses_message_id', { length: 255 }),
  errorMessage: text('error_message'),
  bounceType: varchar('bounce_type', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Type inference
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
export type Email = typeof emails.$inferSelect;
export type NewEmail = typeof emails.$inferInsert;
export type SuppressionEntry = typeof suppressionList.$inferSelect;
export type NewSuppressionEntry = typeof suppressionList.$inferInsert;

