import { describe, expect, it } from 'vitest'
import { formatDate, formatTimestamp } from '@/lib/format'

describe('formatDate', () => {
  it('writes the date out in full by default', () => {
    expect(formatDate('2026-09-12')).toBe('12 de setembro de 2026')
  })

  it('offers a compact style for table columns', () => {
    expect(formatDate('2026-09-12', 'pt-BR', 'medium')).toBe(
      '12 de set. de 2026',
    )
    expect(formatDate('2026-09-12', 'en-US', 'medium')).toBe('Sep 12, 2026')
  })

  it('returns an empty string without a value', () => {
    expect(formatDate(null)).toBe('')
  })
})

describe('formatTimestamp', () => {
  it('shows Brazil time regardless of the server time zone', () => {
    expect(formatTimestamp(new Date('2026-10-07T18:42:00Z'))).toContain(
      '15:42',
    )
    expect(formatTimestamp('2026-10-07T18:42:00Z', 'en-US')).toContain('3:42')
    expect(formatTimestamp(new Date('2026-10-07T18:42:00Z'), 'en-US')).toMatch(
      /GMT-3|BRT/,
    )
  })

  it('keeps the Brazilian date across midnight UTC', () => {
    expect(
      formatTimestamp(new Date('2026-10-08T01:30:00Z'), 'pt-BR', false),
    ).toBe('7 de out. de 2026')
  })

  it('returns an empty string without a value', () => {
    expect(formatTimestamp(null)).toBe('')
  })
})
