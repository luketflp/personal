import { describe, expect, it } from 'vitest'
import { pendingMilestones, scrollPercent } from '@/lib/quotes/tracker-math'

describe('scrollPercent', () => {
  it('measures how far the bottom of the viewport has travelled', () => {
    expect(
      scrollPercent({ scrollY: 0, viewportHeight: 800, pageHeight: 3200 }),
    ).toBe(25)
    expect(
      scrollPercent({ scrollY: 1600, viewportHeight: 800, pageHeight: 3200 }),
    ).toBe(75)
  })

  it('is 100 when the whole page fits on screen', () => {
    expect(
      scrollPercent({ scrollY: 0, viewportHeight: 900, pageHeight: 700 }),
    ).toBe(100)
  })

  it('never exceeds 100 on overscroll', () => {
    expect(
      scrollPercent({ scrollY: 2500, viewportHeight: 800, pageHeight: 3200 }),
    ).toBe(100)
  })

  it('is 0 for a page with no height yet', () => {
    expect(
      scrollPercent({ scrollY: 0, viewportHeight: 800, pageHeight: 0 }),
    ).toBe(0)
  })
})

describe('pendingMilestones', () => {
  it('returns every milestone reached and not yet sent', () => {
    expect(pendingMilestones(80, [])).toEqual([25, 50, 75])
    expect(pendingMilestones(80, [25, 50])).toEqual([75])
  })

  it('returns nothing below the first milestone', () => {
    expect(pendingMilestones(24, [])).toEqual([])
  })

  it('returns nothing once all were sent', () => {
    expect(pendingMilestones(100, [25, 50, 75, 100])).toEqual([])
  })
})
