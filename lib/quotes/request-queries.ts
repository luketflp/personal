import { desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { quoteRequests } from '@/lib/db/schema'

export function listRequests() {
  return db.query.quoteRequests.findMany({
    orderBy: [desc(quoteRequests.createdAt)],
  })
}

export function countNewRequests() {
  return db.$count(quoteRequests, eq(quoteRequests.status, 'new'))
}
