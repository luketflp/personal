import { asc, desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { quoteItems, quotes } from '@/lib/db/schema'

export function listQuotes() {
  return db.query.quotes.findMany({
    orderBy: [desc(quotes.createdAt)],
    with: { items: { orderBy: [asc(quoteItems.position)] } },
  })
}

export function getQuoteById(id: string) {
  return db.query.quotes.findFirst({
    where: eq(quotes.id, id),
    with: { items: { orderBy: [asc(quoteItems.position)] } },
  })
}

export function getQuoteBySlug(slug: string) {
  return db.query.quotes.findFirst({
    where: eq(quotes.slug, slug),
    with: { items: { orderBy: [asc(quoteItems.position)] } },
  })
}

export type QuoteWithItems = NonNullable<
  Awaited<ReturnType<typeof getQuoteById>>
>
