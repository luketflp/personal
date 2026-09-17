// Coarse visitor context derived from request metadata. The raw user agent and
// the IP never leave this module; only the labels below are stored.
export type Device = 'mobile' | 'tablet' | 'desktop'

export type ParsedUserAgent = {
  device: Device
  browser: string | null
  os: string | null
}

// Order matters: Edge, Samsung and the iOS wrappers also announce Chrome/Safari.
const BROWSERS: Array<[RegExp, string]> = [
  [/Edg(e|A|iOS)?\//, 'Edge'],
  [/SamsungBrowser\//, 'Samsung Internet'],
  [/OPR\/|Opera/, 'Opera'],
  [/Firefox\/|FxiOS\//, 'Firefox'],
  [/Chrome\/|CriOS\//, 'Chrome'],
  [/Safari\//, 'Safari'],
]

const SYSTEMS: Array<[RegExp, string]> = [
  [/iPad/, 'iPadOS'],
  [/iPhone|iPod/, 'iOS'],
  [/Android/, 'Android'],
  [/Windows/, 'Windows'],
  [/Mac OS X|Macintosh/, 'macOS'],
  [/Linux|X11/, 'Linux'],
]

function firstMatch(table: Array<[RegExp, string]>, ua: string) {
  return table.find(([pattern]) => pattern.test(ua))?.[1] ?? null
}

export function parseUserAgent(ua: string): ParsedUserAgent {
  const device: Device = /iPad|Tablet/.test(ua)
    ? 'tablet'
    : /Android/.test(ua) && !/Mobile/.test(ua)
      ? 'tablet'
      : /Mobi|iPhone|iPod|Android/.test(ua)
        ? 'mobile'
        : 'desktop'

  return {
    device,
    browser: firstMatch(BROWSERS, ua),
    os: firstMatch(SYSTEMS, ua),
  }
}

// Link-preview fetchers (WhatsApp, Telegram, Slack...), crawlers and scripted
// clients. They rarely run JS, but the ingest endpoint can be hit directly.
const BOT_PATTERN =
  /bot(?![a-z])|crawl|spider|slurp|preview|headless|facebookexternalhit|^WhatsApp\/|curl\/|wget\/|python-|node-fetch|axios\/|Go-http-client|lighthouse|pingdom|uptime/i

export function isBot(ua: string | null | undefined): boolean {
  if (!ua) return true
  return BOT_PATTERN.test(ua)
}

const stripWww = (host: string) => host.replace(/^www\./, '')

export function referrerHost(
  referrer: string | null | undefined,
  ownHost: string | null | undefined,
): string | null {
  if (!referrer) return null
  try {
    const host = stripWww(new URL(referrer).hostname)
    if (!host || (ownHost && host === stripWww(ownHost))) return null
    return host
  } catch {
    return null
  }
}

function decodeHeader(value: string | null): string | null {
  if (!value) return null
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export function geoFromHeaders(headers: Headers) {
  return {
    country: headers.get('x-vercel-ip-country'),
    region: headers.get('x-vercel-ip-country-region'),
    city: decodeHeader(headers.get('x-vercel-ip-city')),
  }
}
