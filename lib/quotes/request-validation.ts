import { z } from 'zod'

// Loose international format: optional +, then digits with common separators.
const PHONE_RE = /^\+?[0-9][0-9\s\-().]{5,19}$/

export const quoteRequestSchema = z.object({
  name: z.string().min(1, 'Informe seu nome'),
  email: z.string().email('E-mail inválido'),
  phone: z
    .string()
    .regex(PHONE_RE, 'Telefone inválido')
    .or(z.literal(''))
    .optional(),
  company: z.string().optional(),
  budget: z.string().optional(),
  deadline: z.string().optional(),
  message: z.string().min(1, 'Descreva o que você precisa'),
})

export type QuoteRequestPayload = z.infer<typeof quoteRequestSchema>
