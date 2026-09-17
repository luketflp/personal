import { describe, expect, it } from 'vitest'
import {
  formatDuration,
  formatEventClock,
  formatLastSeen,
  formatSessionTime,
} from '@/lib/quotes/activity-format'

describe('formatDuration', () => {
  it('shows minutes and zero-padded seconds', () => {
    expect(formatDuration(130_000)).toBe('2m 10s')
    expect(formatDuration(185_000)).toBe('3m 05s')
  })

  it('keeps sub-minute reads in the same shape', () => {
    expect(formatDuration(48_000)).toBe('0m 48s')
    expect(formatDuration(0)).toBe('0m 00s')
  })

  it('switches to hours past 60 minutes', () => {
    expect(formatDuration(3_900_000)).toBe('1h 05m')
  })
})

describe('formatLastSeen', () => {
  const now = new Date('2026-09-17T12:00:00Z')

  it('says "agora" within the first minute', () => {
    expect(formatLastSeen(new Date('2026-09-17T11:59:30Z'), now)).toBe('agora')
  })

  it('uses minutes, hours, then days', () => {
    expect(formatLastSeen(new Date('2026-09-17T11:55:00Z'), now)).toBe(
      'há 5 min',
    )
    expect(formatLastSeen(new Date('2026-09-17T10:00:00Z'), now)).toBe('há 2 h')
    expect(formatLastSeen(new Date('2026-09-11T12:00:00Z'), now)).toBe(
      'há 6 dias',
    )
  })
})

describe('formatSessionTime', () => {
  // 12:00 UTC is 09:00 in São Paulo.
  const now = new Date('2026-09-17T12:00:00Z')

  it('labels the current São Paulo day as today', () => {
    expect(formatSessionTime(new Date('2026-09-17T11:14:00Z'), now)).toBe(
      'Hoje, 08:14',
    )
  })

  it('labels the previous São Paulo day as yesterday', () => {
    // 00:47 UTC on the 17th is still 21:47 on the 16th in São Paulo.
    expect(formatSessionTime(new Date('2026-09-17T00:47:00Z'), now)).toBe(
      'Ontem, 21:47',
    )
  })

  it('falls back to day and month for older sessions', () => {
    expect(formatSessionTime(new Date('2026-09-12T17:20:00Z'), now)).toBe(
      '12/09, 14:20',
    )
  })
})

describe('formatEventClock', () => {
  it('shows the São Paulo wall clock with seconds', () => {
    expect(formatEventClock(new Date('2026-09-17T11:14:02Z'))).toBe('08:14:02')
  })
})
