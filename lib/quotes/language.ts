import { LANGUAGE_LOCALES } from '@/lib/format'
import type { QuoteLanguage } from '@/lib/quotes/validation'

export const QUOTE_LANGUAGE_LABELS: Record<QuoteLanguage, string> = {
  pt: 'Português',
  en: 'English',
  es: 'Español',
}

export function quoteLanguage(value: string | null | undefined): QuoteLanguage {
  return value === 'en' || value === 'es' ? value : 'pt'
}

export function quoteLocale(value: string | null | undefined) {
  return LANGUAGE_LOCALES[quoteLanguage(value)]
}
