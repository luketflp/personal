'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { formatMoney } from '@/lib/format'
import { createQuote, updateQuote } from '@/lib/quotes/actions'
import { QUOTE_LANGUAGE_LABELS, quoteLocale } from '@/lib/quotes/language'
import { computeTotals } from '@/lib/quotes/totals'
import {
  CURRENCIES,
  LANGUAGES,
  QUOTE_STATUSES,
  type Currency,
  type QuoteLanguage,
} from '@/lib/quotes/validation'
import type { QuoteStatus } from '@/lib/db/schema'

export type QuoteFormValues = {
  customerName: string
  customerEmail: string
  customerCompany: string
  status: QuoteStatus
  currency: Currency
  language: QuoteLanguage
  issueDate: string
  validUntil: string
  discount: string
  deliveryEstimate: string
  scope: string
  payment: string
  notes: string
  terms: string
  items: {
    description: string
    quantity: string
    unitPrice: string
    details: string
  }[]
}

type QuoteFormProps = {
  mode: 'create' | 'edit'
  quoteId?: string
  defaultValues: QuoteFormValues
}

const STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: 'Rascunho',
  sent: 'Enviado',
  accepted: 'Aceito',
  declined: 'Recusado',
}

// Accept both '1500,50' and '1500.50' (thousands separators are not used).
function parseNumber(value: string | number | undefined): number {
  const n = Number(String(value ?? '').replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

function toCents(value: string | number | undefined): number {
  return Math.round(parseNumber(value) * 100)
}

export function QuoteForm({ mode, quoteId, defaultValues }: QuoteFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const form = useForm<QuoteFormValues>({ defaultValues })
  const { register, control, watch, handleSubmit, formState } = form
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  const currency = watch('currency')
  const language = watch('language')
  const items = watch('items')
  const discount = watch('discount')
  const locale = quoteLocale(language)
  const { subtotalCents, totalCents } = computeTotals(
    (items ?? []).map(it => ({
      quantity: parseNumber(it.quantity),
      unitPriceCents: toCents(it.unitPrice),
    })),
    toCents(discount),
  )

  const onSubmit = handleSubmit(
    values => {
      const payload = {
        customerName: values.customerName,
        customerEmail: values.customerEmail,
        customerCompany: values.customerCompany,
        status: values.status,
        currency: values.currency,
        language: values.language,
        issueDate: values.issueDate,
        validUntil: values.validUntil,
        discountCents: toCents(values.discount),
        deliveryEstimate: values.deliveryEstimate,
        scope: values.scope,
        payment: values.payment,
        notes: values.notes,
        terms: values.terms,
        items: values.items.map(it => ({
          description: it.description,
          quantity: parseNumber(it.quantity),
          unitPriceCents: toCents(it.unitPrice),
          details: it.details,
        })),
      }
      startTransition(async () => {
        const res =
          mode === 'create'
            ? await createQuote(payload)
            : await updateQuote(quoteId as string, payload)
        if (!res.ok) {
          toast.error(res.error)
          return
        }
        toast.success('Orçamento salvo')
        router.push('/dashboard')
        router.refresh()
      })
    },
    () => toast.error('Verifique os campos obrigatórios'),
  )

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cliente</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="customerName">Nome *</Label>
            <Input
              id="customerName"
              {...register('customerName', { required: 'Informe o cliente' })}
            />
            {formState.errors.customerName && (
              <p className="text-sm text-destructive">
                {formState.errors.customerName.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="customerCompany">Empresa</Label>
            <Input id="customerCompany" {...register('customerCompany')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customerEmail">E-mail</Label>
            <Input
              id="customerEmail"
              type="email"
              {...register('customerEmail')}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Itens</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="space-y-2 rounded-md border p-3">
              <div className="grid gap-2 sm:grid-cols-[1fr_6rem_8rem_2.5rem] sm:items-start">
                <Input
                  placeholder="Descrição do serviço"
                  {...register(`items.${index}.description`, {
                    required: true,
                  })}
                />
                <Input
                  inputMode="decimal"
                  placeholder="Qtd."
                  {...register(`items.${index}.quantity`, { required: true })}
                />
                <Input
                  inputMode="decimal"
                  placeholder="Valor unit."
                  {...register(`items.${index}.unitPrice`, { required: true })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Remover item"
                  disabled={fields.length === 1}
                  onClick={() => remove(index)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <Textarea
                rows={2}
                placeholder="Detalhes do item (markdown, opcional) — o que está incluído, entregáveis…"
                {...register(`items.${index}.details`)}
              />
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={() =>
              append({
                description: '',
                quantity: '1',
                unitPrice: '',
                details: '',
              })
            }
          >
            <Plus className="size-4" /> Adicionar item
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detalhes</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Moeda</Label>
            <Controller
              control={control}
              name="currency"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map(c => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {QUOTE_STATUSES.map(s => (
                      <SelectItem key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-2">
            <Label>Idioma</Label>
            <Controller
              control={control}
              name="language"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map(l => (
                      <SelectItem key={l} value={l}>
                        {QUOTE_LANGUAGE_LABELS[l]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="issueDate">Emissão</Label>
            <Input
              id="issueDate"
              type="date"
              {...register('issueDate', { required: true })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="validUntil">Válido até</Label>
            <Input id="validUntil" type="date" {...register('validUntil')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deliveryEstimate">Prazo de entrega</Label>
            <Input
              id="deliveryEstimate"
              placeholder="ex.: 4 semanas"
              {...register('deliveryEstimate')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="discount">Desconto ({currency})</Label>
            <Input
              id="discount"
              inputMode="decimal"
              placeholder="0,00"
              {...register('discount')}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Escopo e observações</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="scope">Escopo do trabalho (markdown)</Label>
            <Textarea
              id="scope"
              rows={6}
              placeholder={
                '## O que envolve\n- Descoberta e wireframes\n- Desenvolvimento\n\n**Não inclui:** hospedagem'
              }
              {...register('scope')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="payment">Pagamento (markdown)</Label>
            <Textarea
              id="payment"
              rows={3}
              placeholder={
                'PIX: chave@exemplo.com\n50% na aprovação, 50% na entrega'
              }
              {...register('payment')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Observações (markdown)</Label>
            <Textarea id="notes" rows={3} {...register('notes')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="terms">Termos / condições (markdown)</Label>
            <Textarea id="terms" rows={3} {...register('terms')} />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1 text-sm">
          <div className="flex justify-between gap-8 text-muted-foreground">
            <span>Subtotal</span>
            <span>{formatMoney(subtotalCents, currency, locale)}</span>
          </div>
          <Separator />
          <div className="flex justify-between gap-8 text-base font-semibold">
            <span>Total</span>
            <span>{formatMoney(totalCents, currency, locale)}</span>
          </div>
        </div>
        <Button type="submit" size="lg" disabled={isPending}>
          {isPending ? 'Salvando…' : 'Salvar orçamento'}
        </Button>
      </div>
    </form>
  )
}
