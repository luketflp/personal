import { and, desc, eq, inArray, ne } from 'drizzle-orm'
import { summarizeContracts, brazilYear } from '@/lib/contracts/stats'
import { db } from '@/lib/db'
import { contracts, quotes, type ContractStatus } from '@/lib/db/schema'

export type ContractFilter = 'open' | 'signed'

const FILTER_STATUSES: Record<ContractFilter, ContractStatus[]> = {
  open: ['draft', 'sent'],
  signed: ['signed'],
}

export function listContracts(filter?: ContractFilter) {
  return db.query.contracts.findMany({
    where: filter
      ? inArray(contracts.status, FILTER_STATUSES[filter])
      : undefined,
    orderBy: [desc(contracts.createdAt)],
  })
}

export function getContractById(id: string) {
  return db.query.contracts.findFirst({ where: eq(contracts.id, id) })
}

export function getContractBySlug(slug: string) {
  return db.query.contracts.findFirst({ where: eq(contracts.slug, slug) })
}

// The quote's non-void contract, if any (at most one, by unique index).
export function getLiveContractForQuote(quoteId: string) {
  return db.query.contracts.findFirst({
    where: and(eq(contracts.quoteId, quoteId), ne(contracts.status, 'void')),
    columns: { id: true, status: true },
  })
}

export async function listQuotesWithoutContract() {
  const [accepted, live] = await Promise.all([
    db.query.quotes.findMany({
      where: eq(quotes.status, 'accepted'),
      orderBy: [desc(quotes.updatedAt)],
      with: { items: true },
    }),
    db
      .select({ quoteId: contracts.quoteId })
      .from(contracts)
      .where(ne(contracts.status, 'void')),
  ])
  const taken = new Set(live.map(row => row.quoteId))
  return accepted.filter(quote => !taken.has(quote.id))
}

export async function contractStats() {
  const rows = await db
    .select({
      status: contracts.status,
      currency: contracts.currency,
      totalCents: contracts.totalCents,
      signedAt: contracts.signedAt,
    })
    .from(contracts)
  return summarizeContracts(rows, brazilYear(new Date()))
}
