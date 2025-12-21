import { pgTable, uuid, varchar, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';

// Email status enum
export const emailStatusEnum = pgEnum('email_status', [
  'pending',     // Created, not yet sent to QStash
  'processing',  // QStash received, webhook processing
  'completed',   // SES accepted the email
  'failed'       // Permanent failure after retries
]);

// Emails table
export const emails = pgTable('emails', {
  id: uuid('id').defaultRandom().primaryKey(),
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
export type Email = typeof emails.$inferSelect;
export type NewEmail = typeof emails.$inferInsert;
