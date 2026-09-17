import {
  SCROLL_MILESTONES,
  type ScrollMilestone,
} from '@/lib/quotes/event-constants'

// How much of the page has passed the bottom edge of the viewport, 0-100.
export function scrollPercent({
  scrollY,
  viewportHeight,
  pageHeight,
}: {
  scrollY: number
  viewportHeight: number
  pageHeight: number
}): number {
  if (pageHeight <= 0) return 0
  const percent = ((scrollY + viewportHeight) / pageHeight) * 100
  return Math.min(100, Math.max(0, Math.round(percent)))
}

export function pendingMilestones(
  percent: number,
  sent: readonly ScrollMilestone[],
): ScrollMilestone[] {
  return SCROLL_MILESTONES.filter(m => percent >= m && !sent.includes(m))
}
