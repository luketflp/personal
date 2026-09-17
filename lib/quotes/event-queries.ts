import { asc, countDistinct, eq, max } from 'drizzle-orm'
import { db } from '@/lib/db'
import { quoteEvents } from '@/lib/db/schema'

export function listQuoteEvents(quoteId: string) {
  return db
    .select()
    .from(quoteEvents)
    .where(eq(quoteEvents.quoteId, quoteId))
    .orderBy(asc(quoteEvents.createdAt))
}

export type ActivitySummary = {
  opens: number
  visitors: number
  lastSeenAt: Date | null
}

// One grouped query for the whole quotes table, keyed by quote id.
export async function listActivitySummaries(): Promise<
  Map<string, ActivitySummary>
> {
  const rows = await db
    .select({
      quoteId: quoteEvents.quoteId,
      opens: countDistinct(quoteEvents.sessionId),
      visitors: countDistinct(quoteEvents.visitorId),
      lastSeenAt: max(quoteEvents.createdAt),
    })
    .from(quoteEvents)
    .groupBy(quoteEvents.quoteId)

  return new Map(rows.map(({ quoteId, ...summary }) => [quoteId, summary]))
}
