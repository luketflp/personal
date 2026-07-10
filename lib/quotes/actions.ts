'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { db } from '@/lib/db'
import { quoteItems, quotes } from '@/lib/db/schema'
import { nextQuoteCode } from '@/lib/quotes/code'
import { quotePayloadSchema } from '@/lib/quotes/validation'

type ActionResult =
  { ok: true; id: string; slug: string } | { ok: false; error: string }

export async function createQuote(input: unknown): Promise<ActionResult> {
  const parsed = quotePayloadSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Dados inválidos' }
  const d = parsed.data
  const slug = nanoid(12)
  const code = await nextQuoteCode(d.issueDate)

  const [row] = await db
    .insert(quotes)
    .values({
      slug,
      code,
      customerName: d.customerName,
      customerEmail: d.customerEmail || null,
      customerCompany: d.customerCompany || null,
      status: d.status,
      currency: d.currency,
      language: d.language,
      issueDate: d.issueDate,
      validUntil: d.validUntil || null,
      discountCents: d.discountCents,
      notes: d.notes || null,
      terms: d.terms || null,
      scope: d.scope || null,
      deliveryEstimate: d.deliveryEstimate || null,
      payment: d.payment || null,
    })
    .returning({ id: quotes.id, slug: quotes.slug })

  await db.insert(quoteItems).values(
    d.items.map((it, i) => ({
      quoteId: row.id,
      description: it.description,
      details: it.details || null,
      quantity: String(it.quantity),
      unitPriceCents: it.unitPriceCents,
      position: i,
    })),
  )

  revalidatePath('/dashboard')
  revalidatePath(`/q/${row.slug}`)
  return { ok: true, id: row.id, slug: row.slug }
}

export async function updateQuote(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  const parsed = quotePayloadSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Dados inválidos' }
  const d = parsed.data

  try {
    // Delete-and-reinsert is the simplest correct reconciliation for items.
    const slug = await db.transaction(async tx => {
      const [row] = await tx
        .update(quotes)
        .set({
          customerName: d.customerName,
          customerEmail: d.customerEmail || null,
          customerCompany: d.customerCompany || null,
          status: d.status,
          currency: d.currency,
          language: d.language,
          issueDate: d.issueDate,
          validUntil: d.validUntil || null,
          discountCents: d.discountCents,
          notes: d.notes || null,
          terms: d.terms || null,
          scope: d.scope || null,
          deliveryEstimate: d.deliveryEstimate || null,
          payment: d.payment || null,
          updatedAt: new Date(),
        })
        .where(eq(quotes.id, id))
        .returning({ slug: quotes.slug })

      if (!row) throw new Error('Quote not found')

      await tx.delete(quoteItems).where(eq(quoteItems.quoteId, id))
      await tx.insert(quoteItems).values(
        d.items.map((it, i) => ({
          quoteId: id,
          description: it.description,
          details: it.details || null,
          quantity: String(it.quantity),
          unitPriceCents: it.unitPriceCents,
          position: i,
        })),
      )
      return row.slug
    })

    revalidatePath('/dashboard')
    revalidatePath(`/q/${slug}`)
    return { ok: true, id, slug }
  } catch {
    return { ok: false, error: 'Não foi possível atualizar o orçamento' }
  }
}

export async function deleteQuote(id: string) {
  // FK cascade removes the quote_items rows.
  await db.delete(quotes).where(eq(quotes.id, id))
  revalidatePath('/dashboard')
  return { ok: true as const }
}
