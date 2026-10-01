'use server'

import { revalidatePath } from 'next/cache'
import { after } from 'next/server'
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

  const text = [
    'Novo pedido de orçamento',
    `Nome: ${d.name}`,
    `E-mail: ${d.email}`,
    d.phone ? `Telefone: ${d.phone}` : null,
    d.company ? `Empresa: ${d.company}` : null,
    d.budget ? `Orçamento: ${d.budget}` : null,
    d.deadline ? `Prazo: ${d.deadline}` : null,
    '',
    d.message,
    '',
    'https://www.lucasalexander.com.br/dashboard/requests',
  ]
    .filter(line => line !== null)
    .join('\n')
  // Runs after the response is sent, so the visitor never waits on Telegram.
  after(() => notifyTelegram(text))

  return { ok: true }
}

// The request is already saved, so a failed alert is only logged.
async function notifyTelegram(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) return
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        // Plain text (no parse_mode): the message is visitor input.
        body: JSON.stringify({
          chat_id: chatId,
          text,
          disable_web_page_preview: true,
        }),
        signal: AbortSignal.timeout(5000),
      },
    )
    if (!res.ok) {
      console.error('Telegram lead alert failed', res.status, await res.text())
    }
  } catch (error) {
    console.error('Telegram lead alert failed', error)
  }
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
