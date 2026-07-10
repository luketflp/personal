import { notFound } from 'next/navigation'
import { QuoteForm, type QuoteFormValues } from '@/components/quotes/quote-form'
import { quoteLanguage } from '@/lib/quotes/language'
import { getQuoteById } from '@/lib/quotes/queries'
import type { Currency } from '@/lib/quotes/validation'

export const dynamic = 'force-dynamic'

const centsToInput = (cents: number) => (cents / 100).toFixed(2)

export default async function EditQuotePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const quote = await getQuoteById(id)
  if (!quote) notFound()

  const defaultValues: QuoteFormValues = {
    customerName: quote.customerName,
    customerEmail: quote.customerEmail ?? '',
    customerCompany: quote.customerCompany ?? '',
    status: quote.status,
    currency: quote.currency as Currency,
    language: quoteLanguage(quote.language),
    issueDate: quote.issueDate,
    validUntil: quote.validUntil ?? '',
    discount: quote.discountCents ? centsToInput(quote.discountCents) : '',
    deliveryEstimate: quote.deliveryEstimate ?? '',
    scope: quote.scope ?? '',
    payment: quote.payment ?? '',
    notes: quote.notes ?? '',
    terms: quote.terms ?? '',
    items: quote.items.map(it => ({
      description: it.description,
      quantity: String(Number(it.quantity)),
      unitPrice: centsToInput(it.unitPriceCents),
      details: it.details ?? '',
    })),
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold tracking-tight">Editar orçamento</h2>
      <QuoteForm mode="edit" quoteId={quote.id} defaultValues={defaultValues} />
    </div>
  )
}
