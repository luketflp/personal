import { describe, expect, it } from 'vitest'
import { detectRequestLanguage, isLanguage } from './language'

describe('detectRequestLanguage', () => {
  it('uses English for US visitors even when Portuguese is accepted', () => {
    expect(
      detectRequestLanguage({
        country: 'US',
        acceptLanguage: 'pt-BR,pt;q=0.9,en;q=0.8',
      }),
    ).toBe('en')
  })

  it('uses Portuguese and Spanish in countries where they are spoken', () => {
    expect(
      detectRequestLanguage({ country: 'BR', acceptLanguage: 'en-US' }),
    ).toBe('pt')
    expect(
      detectRequestLanguage({ country: 'MX', acceptLanguage: 'en-US' }),
    ).toBe('es')
  })

  it('uses the browser preference when location is unavailable', () => {
    expect(
      detectRequestLanguage({
        country: null,
        acceptLanguage: 'fr-FR,es;q=0.9,en;q=0.8',
      }),
    ).toBe('es')
  })

  it('falls back to English when no supported location language is known', () => {
    expect(
      detectRequestLanguage({ country: null, acceptLanguage: 'fr-FR' }),
    ).toBe('en')
  })
})

describe('isLanguage', () => {
  it('only accepts supported languages', () => {
    expect(isLanguage('pt')).toBe(true)
    expect(isLanguage('en')).toBe(true)
    expect(isLanguage('es')).toBe(true)
    expect(isLanguage('fr')).toBe(false)
  })
})
