// Kept free of zod so the public quote page's tracker can import it cheaply.
export const TRACKED_SECTIONS = [
  'scope',
  'items',
  'totals',
  'payment',
  'notes',
] as const
export const SCROLL_MILESTONES = [25, 50, 75, 100] as const

export type TrackedSection = (typeof TRACKED_SECTIONS)[number]
export type ScrollMilestone = (typeof SCROLL_MILESTONES)[number]
