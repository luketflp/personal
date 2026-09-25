import { z } from 'zod'

export const financeEntrySchema = z.object({
  type: z.enum(['income', 'expense']),
  occurredOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  tour: z.string().trim().min(1).max(100),
  description: z.string().trim().max(160).default(''),
  amountCents: z.number().int().positive().max(999_999_999_99),
})

export type FinanceEntryInput = z.infer<typeof financeEntrySchema>
