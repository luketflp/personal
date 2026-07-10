import { QuoteForm, type QuoteFormValues } from '@/components/quotes/quote-form'

export const dynamic = 'force-dynamic'

export default function NewQuotePage() {
  const today = new Date().toISOString().slice(0, 10)
  const defaultValues: QuoteFormValues = {
    customerName: '',
    customerEmail: '',
    customerCompany: '',
    status: 'draft',
    currency: 'BRL',
    language: 'pt',
    issueDate: today,
    validUntil: '',
    discount: '',
    deliveryEstimate: '',
    scope: '',
    payment: '',
    notes: '',
    terms: '',
    items: [{ description: '', quantity: '1', unitPrice: '', details: '' }],
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold tracking-tight">Novo orçamento</h2>
      <QuoteForm mode="create" defaultValues={defaultValues} />
    </div>
  )
}
