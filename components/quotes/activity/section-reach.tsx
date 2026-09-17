import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { QuoteActivity } from '@/lib/quotes/activity'
import { SECTION_LABELS } from '@/lib/quotes/activity-labels'

export function SectionReach({
  reach,
  opens,
}: {
  reach: QuoteActivity['sectionReach']
  opens: number
}) {
  return (
    <Card>
      <CardHeader className="space-y-0.5 pb-4">
        <CardTitle className="text-base">Seções vistas</CardTitle>
        <p className="text-[13px] text-muted-foreground">
          Parte das {opens} {opens === 1 ? 'sessão' : 'sessões'} que chegou a
          cada seção
        </p>
      </CardHeader>
      <CardContent className="space-y-3.5">
        {reach.map(({ name, sessions }) => (
          <div key={name} className="space-y-1.5">
            <div className="flex justify-between text-[13px]">
              <span>{SECTION_LABELS[name]}</span>
              <span className="font-medium tabular-nums">
                {sessions} de {opens}
              </span>
            </div>
            <div
              role="meter"
              aria-label={SECTION_LABELS[name]}
              aria-valuemin={0}
              aria-valuemax={opens}
              aria-valuenow={sessions}
              className="h-2 rounded bg-border"
            >
              <div
                className="h-2 rounded bg-primary"
                style={{ width: `${opens ? (sessions / opens) * 100 : 0}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
