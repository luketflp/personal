import { describe, expect, it } from 'vitest'
import { firstErrors, signPayloadSchema } from '@/lib/contracts/validation'

const valid = {
  name: 'Helena Costa Ribeiro',
  documentType: 'cpf',
  document: '529.982.247-25',
  address: 'Rua das Flores, 120 — Curitiba/PR',
  agree: true,
  versionHash: 'a'.repeat(64),
}

function errorsFor(input: Record<string, unknown>) {
  const result = signPayloadSchema.safeParse(input)
  if (result.success) throw new Error('expected validation to fail')
  return firstErrors(result.error)
}

describe('signPayloadSchema', () => {
  it('accepts a punctuated CPF and stores digits only', () => {
    const result = signPayloadSchema.parse({
      ...valid,
      document: ' 529.982.247-25 ',
    })
    expect(result.document).toBe('52998224725')
    expect(result.name).toBe('Helena Costa Ribeiro')
  })

  it('accepts a lowercase alphanumeric CNPJ and stores it uppercase', () => {
    const result = signPayloadSchema.parse({
      ...valid,
      documentType: 'cnpj',
      document: '12.abc.345/01de-35',
    })
    expect(result.document).toBe('12ABC34501DE35')
  })

  it('accepts any non-empty foreign document', () => {
    const result = signPayloadSchema.parse({
      ...valid,
      documentType: 'other',
      document: '  X  1234567 ',
    })
    expect(result.document).toBe('X 1234567')
  })

  it('rejects a CPF with a wrong check digit', () => {
    expect(errorsFor({ ...valid, document: '529.982.247-24' })).toEqual({
      document: 'invalidDocument',
    })
  })

  it('rejects whitespace-only fields as required', () => {
    expect(errorsFor({ ...valid, name: '   ', address: '\n' })).toEqual({
      name: 'required',
      address: 'required',
    })
  })

  it('treats missing form fields as required', () => {
    expect(errorsFor({ ...valid, name: null })).toEqual({ name: 'required' })
  })

  it('rejects overlong fields', () => {
    expect(errorsFor({ ...valid, name: 'a'.repeat(201) })).toEqual({
      name: 'tooLong',
    })
  })

  it('requires the agreement box', () => {
    expect(errorsFor({ ...valid, agree: false })).toEqual({
      agree: 'mustAgree',
    })
  })

  it('rejects a malformed version hash', () => {
    expect(errorsFor({ ...valid, versionHash: 'abc' })).toEqual({
      versionHash: 'invalid',
    })
  })
})
