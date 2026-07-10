'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { db } from '@/lib/db'
import { quoteItems, quoteRequests, quotes } from '@/lib/db/schema'
import { nextQuoteCode } from '@/lib/quotes/code'
import { quoteRequestSchema } from '@/lib/quotes/request-validation'

// Public: submitted from the homepage form.
export async function createQuoteRequest(
  input: unknown,
): Promise<{ ok: boolean }> {
  const parsed = quoteRequestSchema.safeParse(input)
  if (!parsed.success) return { ok: false }
  const d = parsed.data
  await db.insert(quoteRequests).values({
    name: d.name,
    email: d.email,
    phone: d.phone || null,
    company: d.company || null,
    budget: d.budget || null,
    deadline: d.deadline || null,
    message: d.message,
  })
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/requests')
  return { ok: true }
}

// Dashboard: accept a request -> create a prefilled draft quote.
export async function acceptRequest(
  id: string,
): Promise<{ ok: boolean; quoteId?: string }> {
  const request = await db.query.quoteRequests.findFirst({
    where: eq(quoteRequests.id, id),
  })
  if (!request) return { ok: false }

  const scopeParts = [request.message]
  if (request.budget)
    scopeParts.push(`**Orçamento sugerido:** ${request.budget}`)
  if (request.deadline)
    scopeParts.push(`**Prazo desejado:** ${request.deadline}`)
  const scope = scopeParts.join('\n\n')
  const today = new Date().toISOString().slice(0, 10)
  const code = await nextQuoteCode(today)

  const quoteId = await db.transaction(async tx => {
    const [row] = await tx
      .insert(quotes)
      .values({
        slug: nanoid(12),
        code,
        customerName: request.name,
        customerEmail: request.email,
        customerCompany: request.company,
        status: 'draft',
        currency: 'BRL',
        issueDate: today,
        scope,
      })
      .returning({ id: quotes.id })

    await tx.insert(quoteItems).values({
      quoteId: row.id,
      description: 'Serviço',
      quantity: '1',
      unitPriceCents: 0,
      position: 0,
    })

    await tx
      .update(quoteRequests)
      .set({ status: 'accepted' })
      .where(eq(quoteRequests.id, id))

    return row.id
  })

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/requests')
  return { ok: true, quoteId }
}

export async function declineRequest(id: string): Promise<{ ok: boolean }> {
  await db
    .update(quoteRequests)
    .set({ status: 'declined' })
    .where(eq(quoteRequests.id, id))
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/requests')
  return { ok: true }
}
