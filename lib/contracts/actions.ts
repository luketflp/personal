'use server'

import { revalidatePath } from 'next/cache'
import { and, eq, inArray } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { requireOwner } from '@/lib/auth/require-owner'
import {
  getContractById,
  getLiveContractForQuote,
} from '@/lib/contracts/queries'
import { brazilYear } from '@/lib/contracts/stats'
import {
  EDITABLE_STATUSES,
  isEditable,
  sourcesOf,
} from '@/lib/contracts/status'
import { issuerLegal, renderContractBody } from '@/lib/contracts/template'
import { contractBodySchema } from '@/lib/contracts/validation'
import { db } from '@/lib/db'
import { contracts } from '@/lib/db/schema'
import { nextSequentialCode } from '@/lib/quotes/code'
import { quoteLanguage } from '@/lib/quotes/language'
import { getQuoteById, type QuoteWithItems } from '@/lib/quotes/queries'
import { computeTotals } from '@/lib/quotes/totals'
import { LANGUAGES, type QuoteLanguage } from '@/lib/quotes/validation'

type Failure = { ok: false; error: string }

const MISSING_ISSUER =
  'Configure ISSUER_DOCUMENT, ISSUER_ADDRESS e ISSUER_CITY no ambiente'
const WRONG_STATUS = 'Status não permite esta ação'
const HAS_LIVE_CONTRACT = 'Este orçamento já tem um contrato ativo'

// Everything a contract copies from its quote and the issuer env vars.
// Throws when the issuer env vars are missing.
function snapshot(quote: QuoteWithItems, language: QuoteLanguage) {
  const issuer = issuerLegal()
  return {
    language,
    quoteCode: quote.code,
    customerName: quote.customerName,
    customerCompany: quote.customerCompany,
    customerEmail: quote.customerEmail,
    currency: quote.currency,
    totalCents: computeTotals(quote.items, quote.discountCents).totalCents,
    issuerName: issuer.name,
    issuerDocument: issuer.document,
    issuerAddress: issuer.address,
    body: renderContractBody({
      language,
      quoteCode: quote.code,
      quoteIssueDate: quote.issueDate,
      scope: quote.scope,
      items: quote.items,
      discountCents: quote.discountCents,
      currency: quote.currency,
      deliveryEstimate: quote.deliveryEstimate,
      payment: quote.payment,
      issuerCity: issuer.city,
    }),
  }
}

function revalidateContract(contract: { id: string; slug: string }) {
  revalidatePath('/dashboard/contracts')
  revalidatePath(`/dashboard/contracts/${contract.id}`)
  revalidatePath(`/c/${contract.slug}`)
}

const returning = { id: contracts.id, slug: contracts.slug }

export async function createContractFromQuote(
  quoteId: string,
): Promise<{ ok: true; id: string } | Failure> {
  await requireOwner()
  const quote = await getQuoteById(quoteId)
  if (!quote || quote.status !== 'accepted') {
    return { ok: false, error: 'O orçamento precisa estar aceito' }
  }
  if (await getLiveContractForQuote(quoteId)) {
    return { ok: false, error: HAS_LIVE_CONTRACT }
  }

  let data: ReturnType<typeof snapshot>
  try {
    data = snapshot(quote, quoteLanguage(quote.language))
  } catch (error) {
    console.error('contract snapshot failed', error)
    return { ok: false, error: MISSING_ISSUER }
  }

  try {
    const [row] = await db
      .insert(contracts)
      .values({
        ...data,
        quoteId,
        slug: nanoid(12),
        code: await nextSequentialCode(
          contracts,
          contracts.code,
          'CT',
          String(brazilYear(new Date())),
        ),
      })
      .returning(returning)
    revalidateContract(row)
    revalidatePath(`/dashboard/${quoteId}`)
    return { ok: true, id: row.id }
  } catch (error) {
    // Most likely a double click racing past the live-contract check; the
    // partial unique index rejected the second insert.
    console.error('createContractFromQuote failed', error)
    return { ok: false, error: 'Não foi possível criar o contrato' }
  }
}

export async function updateContractBody(
  id: string,
  body: string,
): Promise<{ ok: true } | Failure> {
  await requireOwner()
  const parsed = contractBodySchema.safeParse(body)
  if (!parsed.success) {
    return { ok: false, error: 'O texto do contrato não pode ficar vazio' }
  }
  const [row] = await db
    .update(contracts)
    .set({ body: parsed.data, updatedAt: new Date() })
    .where(
      and(eq(contracts.id, id), inArray(contracts.status, EDITABLE_STATUSES)),
    )
    .returning(returning)
  if (!row) return { ok: false, error: WRONG_STATUS }
  revalidateContract(row)
  return { ok: true }
}

export async function regenerateContract(
  id: string,
  language: QuoteLanguage,
): Promise<{ ok: true } | Failure> {
  await requireOwner()
  if (!LANGUAGES.includes(language)) {
    return { ok: false, error: 'Idioma inválido' }
  }
  const contract = await getContractById(id)
  if (!contract || !isEditable(contract.status)) {
    return { ok: false, error: WRONG_STATUS }
  }
  const quote = contract.quoteId
    ? await getQuoteById(contract.quoteId)
    : undefined
  if (!quote) return { ok: false, error: 'O orçamento de origem foi excluído' }

  let data: ReturnType<typeof snapshot>
  try {
    data = snapshot(quote, language)
  } catch (error) {
    console.error('contract snapshot failed', error)
    return { ok: false, error: MISSING_ISSUER }
  }

  const [row] = await db
    .update(contracts)
    .set({ ...data, updatedAt: new Date() })
    .where(
      and(eq(contracts.id, id), inArray(contracts.status, EDITABLE_STATUSES)),
    )
    .returning(returning)
  if (!row) return { ok: false, error: WRONG_STATUS }
  revalidateContract(row)
  return { ok: true }
}

export async function sendContract(
  id: string,
): Promise<{ ok: true; slug: string } | Failure> {
  await requireOwner()
  const now = new Date()
  const [row] = await db
    .update(contracts)
    .set({ status: 'sent', sentAt: now, updatedAt: now })
    .where(
      and(eq(contracts.id, id), inArray(contracts.status, sourcesOf('sent'))),
    )
    .returning(returning)
  if (!row) return { ok: false, error: WRONG_STATUS }
  revalidateContract(row)
  return { ok: true, slug: row.slug }
}

export async function voidContract(
  id: string,
): Promise<{ ok: true } | Failure> {
  await requireOwner()
  const [row] = await db
    .update(contracts)
    .set({ status: 'void', updatedAt: new Date() })
    .where(
      and(eq(contracts.id, id), inArray(contracts.status, sourcesOf('void'))),
    )
    .returning(returning)
  if (!row) return { ok: false, error: WRONG_STATUS }
  revalidateContract(row)
  return { ok: true }
}
