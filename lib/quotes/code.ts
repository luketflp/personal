import { desc, like } from 'drizzle-orm'
import { db } from '@/lib/db'
import { quotes } from '@/lib/db/schema'

const CODE_PREFIX = 'LA'

function quoteCodeYear(issueDate: string | Date | null | undefined) {
  if (issueDate instanceof Date) return issueDate.getFullYear()
  if (typeof issueDate === 'string') {
    const year = Number(issueDate.slice(0, 4))
    if (Number.isInteger(year) && year > 0) return year
  }
  return new Date().getFullYear()
}

export async function nextQuoteCode(issueDate: string | Date) {
  const year = quoteCodeYear(issueDate)
  const prefix = `${CODE_PREFIX}-${year}-`
  const [latest] = await db
    .select({ code: quotes.code })
    .from(quotes)
    .where(like(quotes.code, `${prefix}%`))
    .orderBy(desc(quotes.code))
    .limit(1)

  const nextSequence = latest ? Number(latest.code.slice(prefix.length)) + 1 : 1
  return `${prefix}${String(nextSequence).padStart(3, '0')}`
}
