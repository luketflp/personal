import { Globe, Printer, Undo2, type LucideIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { QuoteActivity } from '@/lib/quotes/activity'

export function ActionsCard({
  actions,
}: {
  actions: QuoteActivity['actions']
}) {
  const rows: Array<{ icon: LucideIcon; label: string; count: number }> = [
    {
      icon: Printer,
      label: 'Imprimiu ou salvou em PDF',
      count: actions.prints,
    },
    { icon: Globe, label: 'Visitou o site', count: actions.siteClicks },
    {
      icon: Undo2,
      label: 'Voltou do site para o orçamento',
      count: actions.returns,
    },
  ]

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Ações</CardTitle>
      </CardHeader>
      <CardContent className="pb-3">
        <ul className="divide-y text-sm">
          {rows.map(({ icon: Icon, label, count }) => (
            <li key={label} className="flex items-center gap-3 py-3">
              <Icon className="size-4 shrink-0 text-muted-foreground" />
              <span className="flex-1">{label}</span>
              <span className="font-semibold tabular-nums">{count}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
