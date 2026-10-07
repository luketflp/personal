import { z } from 'zod'
import {
  SIGNER_DOCUMENT_TYPES,
  isValidCnpj,
  isValidCpf,
  normalizeDocument,
} from '@/lib/contracts/document'

// Messages are keys; the public page translates them per contract language.
export type SignErrorKey =
  | 'required'
  | 'tooLong'
  | 'invalidDocument'
  | 'mustAgree'
  | 'invalid'

export type SignField =
  | 'name'
  | 'documentType'
  | 'document'
  | 'address'
  | 'agree'
  | 'versionHash'

const requiredText = (max: number) =>
  z
    .string({ required_error: 'required', invalid_type_error: 'required' })
    .trim()
    .min(1, 'required')
    .max(max, 'tooLong')

export const signPayloadSchema = z
  .object({
    name: requiredText(200),
    documentType: z.enum(SIGNER_DOCUMENT_TYPES, {
      errorMap: () => ({ message: 'invalid' }),
    }),
    document: requiredText(40),
    address: requiredText(300),
    agree: z.literal(true, { errorMap: () => ({ message: 'mustAgree' }) }),
    versionHash: z
      .string({ required_error: 'invalid', invalid_type_error: 'invalid' })
      .regex(/^[0-9a-f]{64}$/, 'invalid'),
  })
  .transform(d => ({
    ...d,
    document: normalizeDocument(d.documentType, d.document),
  }))
  .superRefine((d, ctx) => {
    const valid =
      d.documentType === 'cpf'
        ? isValidCpf(d.document)
        : d.documentType === 'cnpj'
          ? isValidCnpj(d.document)
          : d.document.length > 0
    if (!valid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['document'],
        message: 'invalidDocument',
      })
    }
  })

export type SignPayload = z.infer<typeof signPayloadSchema>

// First error per field, keyed by field name.
export function firstErrors(error: z.ZodError) {
  const errors: Partial<Record<SignField, SignErrorKey>> = {}
  for (const issue of error.issues) {
    const field = issue.path[0] as SignField
    errors[field] ??= issue.message as SignErrorKey
  }
  return errors
}

export const contractBodySchema = z.string().trim().min(1).max(100_000)
