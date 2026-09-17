// The dashboard renders on the server (UTC on Vercel), so clock times are
// pinned to the owner's zone instead of the host's.
export const DASHBOARD_TIME_ZONE = 'America/Sao_Paulo'

const pad = (value: number) => String(value).padStart(2, '0')

export function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${pad(minutes)}m`
  return `${minutes}m ${pad(totalSeconds % 60)}s`
}

const relative = new Intl.RelativeTimeFormat('pt-BR', { style: 'short' })

// ICU abbreviates minutes as "min." but hours as "h"; drop the stray period.
const ago = (value: number, unit: Intl.RelativeTimeFormatUnit) =>
  relative.format(-value, unit).replace(/\.$/, '')

export function formatLastSeen(date: Date, now: Date = new Date()): string {
  const minutes = Math.floor((now.getTime() - date.getTime()) / 60_000)
  if (minutes < 1) return 'agora'
  if (minutes < 60) return ago(minutes, 'minute')
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return ago(hours, 'hour')
  return ago(Math.floor(hours / 24), 'day')
}

const dayKey = new Intl.DateTimeFormat('en-CA', {
  timeZone: DASHBOARD_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})
const clock = new Intl.DateTimeFormat('pt-BR', {
  timeZone: DASHBOARD_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
})
const clockWithSeconds = new Intl.DateTimeFormat('pt-BR', {
  timeZone: DASHBOARD_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
})
const dayAndMonth = new Intl.DateTimeFormat('pt-BR', {
  timeZone: DASHBOARD_TIME_ZONE,
  day: '2-digit',
  month: '2-digit',
})

// Calendar days between two instants, as seen from the dashboard zone.
function daysApart(date: Date, now: Date) {
  const toUtcMidnight = (d: Date) => Date.parse(`${dayKey.format(d)}T00:00:00Z`)
  return Math.round((toUtcMidnight(now) - toUtcMidnight(date)) / 86_400_000)
}

export function formatSessionTime(date: Date, now: Date = new Date()): string {
  const days = daysApart(date, now)
  const day =
    days === 0 ? 'Hoje' : days === 1 ? 'Ontem' : dayAndMonth.format(date)
  return `${day}, ${clock.format(date)}`
}

export function formatEventClock(date: Date): string {
  return clockWithSeconds.format(date)
}
