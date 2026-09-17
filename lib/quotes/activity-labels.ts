import type { QuoteEvent } from '@/lib/db/schema'
import type { SessionSummary } from '@/lib/quotes/activity'
import { formatDuration } from '@/lib/quotes/activity-format'
import type { TrackedSection } from '@/lib/quotes/event-constants'

// Dashboard copy is Portuguese only, like the rest of /dashboard.
export const SECTION_LABELS: Record<TrackedSection, string> = {
  scope: 'Escopo do trabalho',
  items: 'Itens',
  totals: 'Total',
  payment: 'Pagamento',
  notes: 'Observações e termos',
}

const DEVICE_NAMES: Record<string, string> = { iOS: 'iPhone', iPadOS: 'iPad' }

function place(session: SessionSummary) {
  if (session.city) {
    return session.region ? `${session.city}, ${session.region}` : session.city
  }
  return session.country
}

function arrival(session: SessionSummary) {
  if (session.source === 'site') return 'voltou do site'
  if (session.referrerHost) return `via ${session.referrerHost}`
  return 'acesso direto'
}

// The "iPhone · Safari · Florianópolis, SC · acesso direto" line of a session.
export function describeSession(session: SessionSummary): string[] {
  return [
    session.os ? (DEVICE_NAMES[session.os] ?? session.os) : null,
    session.browser,
    place(session),
    arrival(session),
    session.isFirstOpen ? 'primeira abertura' : null,
  ].filter((part): part is string => Boolean(part))
}

export function describeEvent(
  event: QuoteEvent,
  session: SessionSummary,
): string {
  switch (event.type) {
    case 'view':
      if (session.isFirstOpen) return 'Abriu o orçamento pela primeira vez'
      if (session.source === 'site') return 'Voltou do site para o orçamento'
      return 'Abriu o orçamento'
    case 'section':
      return `Viu a seção ${SECTION_LABELS[event.data?.name as TrackedSection] ?? ''}`.trim()
    case 'scroll':
      return `Rolou até ${event.data?.depth ?? 0}%`
    case 'leave':
      return `Saiu da página, ${formatDuration(Number(event.data?.activeMs ?? 0))} de leitura ativa`
    case 'print':
      return 'Imprimiu ou salvou em PDF'
    case 'site_click':
      return 'Clicou para visitar o site'
  }
}

const plural = (count: number, one: string, many: string) =>
  `${count} ${count === 1 ? one : many}`

export function formatOpens(opens: number, visitors: number): string {
  return `${plural(opens, 'abertura', 'aberturas')} · ${plural(visitors, 'visitante', 'visitantes')}`
}
