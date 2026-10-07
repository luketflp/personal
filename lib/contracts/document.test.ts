import { describe, expect, it } from 'vitest'
import {
  documentLine,
  formatDocument,
  isValidCnpj,
  isValidCpf,
  normalizeDocument,
} from '@/lib/contracts/document'

describe('isValidCpf', () => {
  it('accepts valid CPFs', () => {
    expect(isValidCpf('52998224725')).toBe(true)
    expect(isValidCpf('12345678909')).toBe(true)
  })

  it('rejects wrong check digits, repeated digits and wrong lengths', () => {
    expect(isValidCpf('52998224724')).toBe(false)
    expect(isValidCpf('11111111111')).toBe(false)
    expect(isValidCpf('5299822472')).toBe(false)
    // Expects normalized input.
    expect(isValidCpf('529.982.247-25')).toBe(false)
  })
})

describe('isValidCnpj', () => {
  it('accepts numeric and alphanumeric CNPJs', () => {
    expect(isValidCnpj('11222333000181')).toBe(true)
    expect(isValidCnpj('12ABC34501DE35')).toBe(true)
  })

  it('rejects wrong check digits, repeated digits and bad shapes', () => {
    expect(isValidCnpj('11222333000182')).toBe(false)
    expect(isValidCnpj('00000000000000')).toBe(false)
    expect(isValidCnpj('12ABC34501DE3X')).toBe(false)
    expect(isValidCnpj('1122233300018')).toBe(false)
  })
})

describe('normalizeDocument', () => {
  it('keeps CPF digits only', () => {
    expect(normalizeDocument('cpf', ' 529.982.247-25 ')).toBe('52998224725')
  })

  it('uppercases CNPJ and drops punctuation', () => {
    expect(normalizeDocument('cnpj', '12.abc.345/01de-35')).toBe(
      '12ABC34501DE35',
    )
  })

  it('trims and collapses whitespace for other documents', () => {
    expect(normalizeDocument('other', '  X  1234567 ')).toBe('X 1234567')
  })
})

describe('formatDocument', () => {
  it('formats CPF and CNPJ', () => {
    expect(formatDocument('cpf', '52998224725')).toBe('529.982.247-25')
    expect(formatDocument('cnpj', '12ABC34501DE35')).toBe('12.ABC.345/01DE-35')
  })

  it('passes other documents through and handles empty values', () => {
    expect(formatDocument('other', 'X1234567')).toBe('X1234567')
    expect(formatDocument('cpf', null)).toBe('')
  })
})

describe('documentLine', () => {
  it('prefixes Brazilian documents with their type', () => {
    expect(documentLine('cpf', '52998224725')).toBe('CPF 529.982.247-25')
    expect(documentLine('cnpj', '11222333000181')).toBe(
      'CNPJ 11.222.333/0001-81',
    )
    expect(documentLine('other', 'X1234567')).toBe('X1234567')
  })
})
