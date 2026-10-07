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
  dateStyle: 'long' | 'medium' = 'long',
) {
  if (!value) return ''
  // `date` columns come back as 'YYYY-MM-DD'; append time to avoid a UTC
  // off-by-one when the local zone is behind UTC.
  const d = typeof value === 'string' ? new Date(`${value}T00:00:00`) : value
  return new Intl.DateTimeFormat(locale, { dateStyle }).format(d)
}

export function formatDatePtBR(value: string | Date | null | undefined) {
  return formatDate(value, 'pt-BR')
}

// Timestamps (timestamptz) render in Brazil time; the server runs in UTC.
export function formatTimestamp(
  value: Date | string | null | undefined,
  locale: Locale = 'pt-BR',
  withTime = true,
) {
  if (!value) return ''
  const timeZone = 'America/Sao_Paulo'
  // timeZoneName cannot be combined with dateStyle/timeStyle.
  const options: Intl.DateTimeFormatOptions = withTime
    ? {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
        timeZone,
      }
    : { dateStyle: 'medium', timeZone }
  return new Intl.DateTimeFormat(locale, options).format(new Date(value))
}
