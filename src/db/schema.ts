import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
  index,
  uniqueIndex,
  integer,
} from 'drizzle-orm/pg-core';

// Email status enum
export const emailStatusEnum = pgEnum('email_status', [
  'pending',
  'processing',
  'completed',
  'failed',
  'bounced',
  'complained',
]);

// Batch status enum
export const batchStatusEnum = pgEnum('batch_status', [
  'processing',
  'completed',
  'partial',
  'failed',
]);

// Suppression reason enum
export const suppressionReasonEnum = pgEnum(
  'suppression_reason',
  ['bounce', 'complaint', 'unsubscribe', 'manual']
);

// Suppression source enum
export const suppressionSourceEnum = pgEnum(
  'suppression_source',
  ['ses', 'link', 'api', 'dashboard']
);

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  email: varchar('email', { length: 255 })
    .notNull()
    .unique(),
  name: varchar('name', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// API Keys table
export const apiKeys = pgTable(
  'api_keys',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id)
      .notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    keyHash: varchar('key_hash', { length: 64 })
      .notNull()
      .unique(),
    keyPrefix: varchar('key_prefix', {
      length: 12,
    }).notNull(),
    lastUsedAt: timestamp('last_used_at'),
    createdAt: timestamp('created_at')
      .defaultNow()
      .notNull(),
    revokedAt: timestamp('revoked_at'),
  },
  (table) => [
    index('api_keys_user_id_idx').on(table.userId),
  ]
);

// Suppression list - emails that should not receive messages
export const suppressionList = pgTable(
  'suppression_list',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 255 }).notNull(),
    reason: suppressionReasonEnum('reason').notNull(),
    source: suppressionSourceEnum('source'),
    userId: uuid('user_id').references(() => users.id),
    emailId: uuid('email_id').references(() => emails.id),
    createdAt: timestamp('created_at')
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('suppression_list_email_idx').on(
      table.email
    ),
  ]
);

// Batches table - tracks batch send operations
export const batches = pgTable(
  'batches',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id)
      .notNull(),
    templateId: uuid('template_id').references(
      () => templates.id
    ),
    total: integer('total').notNull(),
    valid: integer('valid').notNull(),
    suppressed: integer('suppressed').default(0).notNull(),
    duplicates: integer('duplicates').default(0).notNull(),
    queued: integer('queued').default(0).notNull(),
    completed: integer('completed').default(0).notNull(),
    failed: integer('failed').default(0).notNull(),
    opened: integer('opened').default(0).notNull(),
    clicked: integer('clicked').default(0).notNull(),
    status: batchStatusEnum('status')
      .default('processing')
      .notNull(),
    createdAt: timestamp('created_at')
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('batches_user_id_idx').on(table.userId),
    index('batches_created_at_idx').on(table.createdAt),
  ]
);

// Emails table
export const emails = pgTable(
  'emails',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id),
    batchId: uuid('batch_id').references(() => batches.id),
    to: varchar('to', { length: 255 }).notNull(),
    subject: varchar('subject', { length: 500 }).notNull(),
    html: text('html'),
    text: text('text'),
    status: emailStatusEnum('status')
      .default('pending')
      .notNull(),
    messageId: varchar('message_id', { length: 255 }),
    sesMessageId: varchar('ses_message_id', {
      length: 255,
    }),
    errorMessage: text('error_message'),
    bounceType: varchar('bounce_type', { length: 50 }),
    openedAt: timestamp('opened_at'),
    clickedAt: timestamp('clicked_at'),
    createdAt: timestamp('created_at')
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('emails_user_id_idx').on(table.userId),
    index('emails_batch_id_idx').on(table.batchId),
    index('emails_created_at_idx').on(table.createdAt),
  ]
);

// Email templates - reusable templates with variable substitution
export const templates = pgTable(
  'templates',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id)
      .notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    subject: varchar('subject', { length: 500 }).notNull(),
    html: text('html').notNull(),
    variables: text('variables'), // JSON array of variable names
    createdAt: timestamp('created_at')
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('templates_user_id_idx').on(table.userId),
  ]
);

// Webhooks table - User subscriptions to events
export const webhooks = pgTable(
  'webhooks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id)
      .notNull(),
    url: varchar('url', { length: 2000 }).notNull(),
    events: text('events').notNull(), // JSON array of event types
    secret: varchar('secret', { length: 255 }).notNull(), // Signing secret
    createdAt: timestamp('created_at')
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('webhooks_user_id_idx').on(table.userId),
  ]
);

// Webhook events - Log of sent webhooks
export const webhookEvents = pgTable(
  'webhook_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    webhookId: uuid('webhook_id')
      .references(() => webhooks.id)
      .notNull(),
    eventType: varchar('event_type', {
      length: 50,
    }).notNull(),
    payload: text('payload').notNull(), // JSON payload
    responseStatus: integer('response_status'),
    responseBody: text('response_body'),
    createdAt: timestamp('created_at')
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('webhook_events_webhook_id_idx').on(
      table.webhookId
    ),
  ]
);

// Type inference
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
export type Email = typeof emails.$inferSelect;
export type NewEmail = typeof emails.$inferInsert;
export type SuppressionEntry =
  typeof suppressionList.$inferSelect;
export type NewSuppressionEntry =
  typeof suppressionList.$inferInsert;
export type Template = typeof templates.$inferSelect;
export type NewTemplate = typeof templates.$inferInsert;
export type Batch = typeof batches.$inferSelect;
export type NewBatch = typeof batches.$inferInsert;
export type Webhook = typeof webhooks.$inferSelect;
export type NewWebhook = typeof webhooks.$inferInsert;
export type WebhookEvent =
  typeof webhookEvents.$inferSelect;
export type NewWebhookEvent =
  typeof webhookEvents.$inferInsert;
