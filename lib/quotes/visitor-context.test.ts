import { describe, expect, it } from 'vitest'
import {
  geoFromHeaders,
  isBot,
  parseUserAgent,
  referrerHost,
} from '@/lib/quotes/visitor-context'

const UA = {
  iphoneSafari:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  iphoneChrome:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.6478.153 Mobile/15E148 Safari/604.1',
  ipadSafari:
    'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  androidChrome:
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36',
  androidSamsung:
    'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/121.0.0.0 Mobile Safari/537.36',
  windowsChrome:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  windowsEdge:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0',
  macFirefox:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:127.0) Gecko/20100101 Firefox/127.0',
  macSafari:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
  linuxChrome:
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
}

describe('parseUserAgent', () => {
  it.each([
    ['iphoneSafari', 'mobile', 'Safari', 'iOS'],
    ['iphoneChrome', 'mobile', 'Chrome', 'iOS'],
    ['ipadSafari', 'tablet', 'Safari', 'iPadOS'],
    ['androidChrome', 'mobile', 'Chrome', 'Android'],
    ['androidSamsung', 'mobile', 'Samsung Internet', 'Android'],
    ['windowsChrome', 'desktop', 'Chrome', 'Windows'],
    ['windowsEdge', 'desktop', 'Edge', 'Windows'],
    ['macFirefox', 'desktop', 'Firefox', 'macOS'],
    ['macSafari', 'desktop', 'Safari', 'macOS'],
    ['linuxChrome', 'desktop', 'Chrome', 'Linux'],
  ] as const)('reads %s', (key, device, browser, os) => {
    expect(parseUserAgent(UA[key])).toEqual({ device, browser, os })
  })

  it('falls back to desktop with unknown browser and os', () => {
    expect(parseUserAgent('SomethingNew/1.0')).toEqual({
      device: 'desktop',
      browser: null,
      os: null,
    })
  })
})

describe('isBot', () => {
  it.each([
    'WhatsApp/2.23.20.0 A',
    'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
    'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'TelegramBot (like TwitterBot)',
    'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/126.0.0.0 Safari/537.36',
    'curl/8.5.0',
    'python-requests/2.32.0',
  ])('flags %s', ua => {
    expect(isBot(ua)).toBe(true)
  })

  it('flags a missing user agent', () => {
    expect(isBot(null)).toBe(true)
    expect(isBot('')).toBe(true)
  })

  it.each([UA.iphoneSafari, UA.androidChrome, UA.windowsEdge, UA.macFirefox])(
    'lets a real browser through: %s',
    ua => {
      expect(isBot(ua)).toBe(false)
    },
  )
})

describe('referrerHost', () => {
  it('keeps only the host, without www', () => {
    expect(
      referrerHost('https://www.google.com/search?q=orcamento', 'site.com'),
    ).toBe('google.com')
  })

  it('ignores navigation from the own site', () => {
    expect(referrerHost('https://site.com/?q=abc', 'site.com')).toBeNull()
    expect(referrerHost('https://www.site.com/', 'site.com')).toBeNull()
  })

  it('returns null for an empty or malformed referrer', () => {
    expect(referrerHost(undefined, 'site.com')).toBeNull()
    expect(referrerHost('', 'site.com')).toBeNull()
    expect(referrerHost('not a url', 'site.com')).toBeNull()
  })
})

describe('geoFromHeaders', () => {
  it('decodes the Vercel geo headers', () => {
    const headers = new Headers({
      'x-vercel-ip-country': 'BR',
      'x-vercel-ip-country-region': 'SP',
      'x-vercel-ip-city': 'S%C3%A3o%20Paulo',
    })
    expect(geoFromHeaders(headers)).toEqual({
      country: 'BR',
      region: 'SP',
      city: 'São Paulo',
    })
  })

  it('returns nulls when the headers are absent', () => {
    expect(geoFromHeaders(new Headers())).toEqual({
      country: null,
      region: null,
      city: null,
    })
  })

  it('keeps the raw city when its encoding is broken', () => {
    const headers = new Headers({ 'x-vercel-ip-city': '%E0%A4%A' })
    expect(geoFromHeaders(headers).city).toBe('%E0%A4%A')
  })
})
