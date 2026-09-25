import { z } from 'zod'

export const PROJECT_COLORS = [
  '#059669',
  '#0284c7',
  '#7c3aed',
  '#d97706',
  '#e11d48',
  '#52525b',
] as const

export const financeEntrySchema = z.object({
  type: z.enum(['income', 'expense']),
  occurredOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  projectId: z.string().uuid(),
  description: z.string().trim().max(160).default(''),
  amountCents: z.number().int().positive().max(999_999_999_99),
})

export type FinanceEntryInput = z.infer<typeof financeEntrySchema>

export const projectSchema = z.object({
  name: z.string().trim().min(1).max(100),
  kind: z.enum(['passeio', 'servico', 'outro']),
  color: z.enum(PROJECT_COLORS),
})

export type ProjectInput = z.infer<typeof projectSchema>
