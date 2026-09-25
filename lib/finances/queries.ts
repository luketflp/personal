import { and, asc, desc, gte, lt } from 'drizzle-orm'
import { db } from '@/lib/db'
import { financeEntries } from '@/lib/db/schema'
import { monthBounds } from '@/lib/finances/math'

export function listFinanceEntries(month: string) {
  const { start, end } = monthBounds(month)

  return db.query.financeEntries.findMany({
    where: and(
      gte(financeEntries.occurredOn, start),
      lt(financeEntries.occurredOn, end),
    ),
    orderBy: [desc(financeEntries.occurredOn), desc(financeEntries.createdAt)],
  })
}

export async function listFinanceTourNames() {
  const rows = await db
    .selectDistinct({ tour: financeEntries.tour })
    .from(financeEntries)
    .orderBy(asc(financeEntries.tour))

  return rows.map(row => row.tour)
}
