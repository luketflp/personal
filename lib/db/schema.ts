import { relations, sql } from 'drizzle-orm'
import {
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

export const quoteStatus = pgEnum('quote_status', [
  'draft',
  'sent',
  'accepted',
  'declined',
])

export const quotes = pgTable(
  'quotes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    slug: varchar('slug', { length: 24 }).notNull(),
    code: varchar('code', { length: 16 }).notNull(),
    customerName: text('customer_name').notNull(),
    customerEmail: text('customer_email'),
    customerCompany: text('customer_company'),
    status: quoteStatus('status').notNull().default('draft'),
    currency: varchar('currency', { length: 3 }).notNull().default('BRL'),
    language: varchar('language', { length: 2 }).notNull().default('pt'),
    issueDate: date('issue_date')
      .notNull()
      .default(sql`now()`),
    validUntil: date('valid_until'),
    discountCents: integer('discount_cents').notNull().default(0),
    notes: text('notes'),
    terms: text('terms'),
    scope: text('scope'),
    deliveryEstimate: text('delivery_estimate'),
    payment: text('payment'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  table => ({
    slugIdx: uniqueIndex('quotes_slug_idx').on(table.slug),
    codeIdx: uniqueIndex('quotes_code_idx').on(table.code),
    createdAtIdx: index('quotes_created_at_idx').on(table.createdAt),
  }),
)

export const quoteItems = pgTable(
  'quote_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    quoteId: uuid('quote_id')
      .notNull()
      .references(() => quotes.id, { onDelete: 'cascade' }),
    description: text('description').notNull(),
    details: text('details'),
    quantity: numeric('quantity', { precision: 12, scale: 2 })
      .notNull()
      .default('1'),
    unitPriceCents: integer('unit_price_cents').notNull().default(0),
    position: integer('position').notNull().default(0),
  },
  table => ({
    quoteIdx: index('quote_items_quote_id_idx').on(table.quoteId),
  }),
)

export const quoteEventType = pgEnum('quote_event_type', [
  'view',
  'section',
  'scroll',
  'leave',
  'print',
  'site_click',
])

// Append-only log of what visitors do on the public quote page. Context
// columns (device, geo, referrer) are filled on `view` rows only.
export const quoteEvents = pgTable(
  'quote_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    quoteId: uuid('quote_id')
      .notNull()
      .references(() => quotes.id, { onDelete: 'cascade' }),
    type: quoteEventType('type').notNull(),
    visitorId: varchar('visitor_id', { length: 24 }).notNull(),
    sessionId: varchar('session_id', { length: 24 }).notNull(),
    data: jsonb('data').$type<Record<string, string | number>>(),
    device: varchar('device', { length: 8 }),
    browser: text('browser'),
    os: text('os'),
    referrerHost: text('referrer_host'),
    country: varchar('country', { length: 2 }),
    region: text('region'),
    city: text('city'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  table => ({
    quoteCreatedAtIdx: index('quote_events_quote_created_at_idx').on(
      table.quoteId,
      table.createdAt,
    ),
    quoteSessionIdx: index('quote_events_quote_session_idx').on(
      table.quoteId,
      table.sessionId,
    ),
  }),
)

export const quotesRelations = relations(quotes, ({ many }) => ({
  items: many(quoteItems),
}))

export const quoteItemsRelations = relations(quoteItems, ({ one }) => ({
  quote: one(quotes, {
    fields: [quoteItems.quoteId],
    references: [quotes.id],
  }),
}))

export type Quote = typeof quotes.$inferSelect
export type QuoteItem = typeof quoteItems.$inferSelect
export type QuoteStatus = (typeof quoteStatus.enumValues)[number]
export type QuoteEvent = typeof quoteEvents.$inferSelect
export type NewQuoteEvent = typeof quoteEvents.$inferInsert

export const requestStatus = pgEnum('request_status', [
  'new',
  'accepted',
  'declined',
])

export const quoteRequests = pgTable(
  'quote_requests',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    phone: text('phone'),
    company: text('company'),
    budget: text('budget'),
    deadline: text('deadline'),
    message: text('message').notNull(),
    status: requestStatus('status').notNull().default('new'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  table => ({
    createdAtIdx: index('quote_requests_created_at_idx').on(table.createdAt),
  }),
)

export type QuoteRequest = typeof quoteRequests.$inferSelect
export type RequestStatus = (typeof requestStatus.enumValues)[number]

export const financeEntryType = pgEnum('finance_entry_type', [
  'income',
  'expense',
])

export const projectKind = pgEnum('project_kind', [
  'passeio',
  'servico',
  'outro',
])

export const projects = pgTable(
  'projects',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    kind: projectKind('kind').notNull().default('passeio'),
    color: varchar('color', { length: 7 }).notNull().default('#059669'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  table => ({
    nameIdx: uniqueIndex('projects_name_idx').on(sql`lower(${table.name})`),
  }),
)

export const financeEntries = pgTable(
  'finance_entries',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    type: financeEntryType('type').notNull(),
    occurredOn: date('occurred_on').notNull(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id),
    description: text('description'),
    amountCents: integer('amount_cents').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  table => ({
    occurredOnIdx: index('finance_entries_occurred_on_idx').on(
      table.occurredOn,
    ),
    projectIdx: index('finance_entries_project_id_idx').on(table.projectId),
  }),
)

export const projectsRelations = relations(projects, ({ many }) => ({
  entries: many(financeEntries),
}))

export const financeEntriesRelations = relations(financeEntries, ({ one }) => ({
  project: one(projects, {
    fields: [financeEntries.projectId],
    references: [projects.id],
  }),
}))

export type Project = typeof projects.$inferSelect
export type ProjectKind = (typeof projectKind.enumValues)[number]
export type FinanceEntry = typeof financeEntries.$inferSelect
export type FinanceEntryType = (typeof financeEntryType.enumValues)[number]
