export const LANGUAGE_LOCALES = {
  pt: 'pt-BR',
  en: 'en-US',
  es: 'es-ES',
} as const

export type Locale = (typeof LANGUAGE_LOCALES)[keyof typeof LANGUAGE_LOCALES]

export function formatMoney(
  cents: number,
  currency = 'BRL',
  locale: Locale = 'pt-BR',
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format((cents ?? 0) / 100)
}

export function formatDate(
  value: string | Date | null | undefined,
  locale: Locale = 'pt-BR',
) {
  if (!value) return ''
  // `date` columns come back as 'YYYY-MM-DD'; append time to avoid a UTC
  // off-by-one when the local zone is behind UTC.
  const d = typeof value === 'string' ? new Date(`${value}T00:00:00`) : value
  return new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(d)
}

export function formatDatePtBR(value: string | Date | null | undefined) {
  return formatDate(value, 'pt-BR')
}
