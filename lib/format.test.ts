import { describe, expect, it } from 'vitest'
import { formatDate } from '@/lib/format'

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
