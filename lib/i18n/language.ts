import type { Language } from './dictionaries'

export const LANGUAGE_COOKIE = 'language'
export const LANGUAGE_TAGS: Record<Language, string> = {
  pt: 'pt-BR',
  en: 'en-US',
  es: 'es',
}

const LANGUAGES = new Set<Language>(['pt', 'en', 'es'])

const PORTUGUESE_SPEAKING_COUNTRIES = new Set([
  'AO',
  'BR',
  'CV',
  'GW',
  'MO',
  'MZ',
  'PT',
  'ST',
  'TL',
])

const SPANISH_SPEAKING_COUNTRIES = new Set([
  'AR',
  'BO',
  'CL',
  'CO',
  'CR',
  'CU',
  'DO',
  'EC',
  'ES',
  'GQ',
  'GT',
  'HN',
  'MX',
  'NI',
  'PA',
  'PE',
  'PR',
  'PY',
  'SV',
  'UY',
  'VE',
])

export function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && LANGUAGES.has(value as Language)
}

function languageFromCountry(country: string | null) {
  if (!country) return null

  const countryCode = country.trim().toUpperCase()
  if (!countryCode) return null
  if (PORTUGUESE_SPEAKING_COUNTRIES.has(countryCode)) return 'pt' as const
  if (SPANISH_SPEAKING_COUNTRIES.has(countryCode)) return 'es' as const

  // English is the site's international fallback, including for US visitors.
  return 'en' as const
}

function languageFromAcceptLanguage(acceptLanguage: string | null) {
  if (!acceptLanguage) return null

  const preferredLanguages = acceptLanguage
    .split(',')
    .map((entry, index) => {
      const [locale, ...parameters] = entry.trim().split(';')
      const qualityParameter = parameters.find(parameter =>
        parameter.trim().startsWith('q='),
      )
      const quality = qualityParameter
        ? Number.parseFloat(qualityParameter.trim().slice(2))
        : 1

      return { locale, quality: Number.isNaN(quality) ? 0 : quality, index }
    })
    .sort((a, b) => b.quality - a.quality || a.index - b.index)

  for (const { locale } of preferredLanguages) {
    const language = locale.toLowerCase().split('-')[0]
    if (isLanguage(language)) return language
  }

  return null
}

export function detectRequestLanguage({
  country,
  acceptLanguage,
}: {
  country: string | null
  acceptLanguage: string | null
}): Language {
  return (
    languageFromCountry(country) ??
    languageFromAcceptLanguage(acceptLanguage) ??
    'en'
  )
}
