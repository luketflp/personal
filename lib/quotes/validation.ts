import { z } from 'zod'

export const CURRENCIES = ['BRL', 'USD', 'EUR'] as const
export const LANGUAGES = ['pt', 'en', 'es'] as const
export const QUOTE_STATUSES = ['draft', 'sent', 'accepted', 'declined'] as const

export const quoteItemPayload = z.object({
  description: z.string().min(1, 'Descrição obrigatória'),
  quantity: z.coerce.number().positive('Quantidade inválida'),
  unitPriceCents: z.coerce.number().int().min(0),
  details: z.string().optional(),
})

// Money crosses the client -> server boundary already in integer cents.
export const quotePayloadSchema = z.object({
  customerName: z.string().min(1, 'Informe o cliente'),
  customerEmail: z
    .string()
    .email('E-mail inválido')
    .or(z.literal(''))
    .optional(),
  customerCompany: z.string().optional(),
  status: z.enum(QUOTE_STATUSES),
  currency: z.enum(CURRENCIES),
  language: z.enum(LANGUAGES).default('pt'),
  issueDate: z.string().min(1, 'Informe a data de emissão'),
  validUntil: z.string().or(z.literal('')).optional(),
  discountCents: z.coerce.number().int().min(0).default(0),
  notes: z.string().optional(),
  terms: z.string().optional(),
  scope: z.string().optional(),
  deliveryEstimate: z.string().optional(),
  payment: z.string().optional(),
  items: z.array(quoteItemPayload).min(1, 'Adicione ao menos um item'),
})

export type QuotePayload = z.infer<typeof quotePayloadSchema>
export type Currency = (typeof CURRENCIES)[number]
export type QuoteLanguage = (typeof LANGUAGES)[number]
