import { and, count, eq } from 'drizzle-orm'
import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { quoteEvents, quotes } from '@/lib/db/schema'
import {
  MAX_EVENT_BODY_BYTES,
  MAX_EVENTS_PER_SESSION,
  buildEventRow,
} from '@/lib/quotes/event-ingest'
import { quoteEventSchema } from '@/lib/quotes/event-validation'
import { isBot } from '@/lib/quotes/visitor-context'

// Always 204: the response never tells a caller whether the slug exists or
// whether the event was kept.
const accepted = () => new NextResponse(null, { status: 204 })

function parseBody(body: string) {
  try {
    return quoteEventSchema.safeParse(JSON.parse(body))
  } catch {
    return null
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  if (!/^[\w-]{6,32}$/.test(slug)) return accepted()
  if (isBot(req.headers.get('user-agent'))) return accepted()

  // The owner previewing a quote while logged in is not a client visit.
  const token = req.cookies.get(SESSION_COOKIE)?.value
  if (token && (await verifySessionToken(token))) return accepted()

  const body = await req.text()
  if (body.length > MAX_EVENT_BODY_BYTES) return accepted()
  const parsed = parseBody(body)
  if (!parsed?.success) return accepted()

  try {
    const [quote] = await db
      .select({ id: quotes.id })
      .from(quotes)
      .where(eq(quotes.slug, slug))
      .limit(1)
    if (!quote) return accepted()

    const [{ recorded }] = await db
      .select({ recorded: count() })
      .from(quoteEvents)
      .where(
        and(
          eq(quoteEvents.quoteId, quote.id),
          eq(quoteEvents.sessionId, parsed.data.sessionId),
        ),
      )
    if (recorded >= MAX_EVENTS_PER_SESSION) return accepted()

    await db.insert(quoteEvents).values(
      buildEventRow({
        quoteId: quote.id,
        event: parsed.data,
        headers: req.headers,
      }),
    )
  } catch (error) {
    console.error('Failed to record quote event', error)
  }

  return accepted()
}
