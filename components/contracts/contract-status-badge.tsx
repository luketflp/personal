import { Badge } from '@/components/ui/badge'
import { CONTRACT_STATUS_BADGES } from '@/lib/contracts/status'
import type { ContractStatus } from '@/lib/db/schema'
import { cn } from '@/lib/utils'

export function ContractStatusBadge({ status }: { status: ContractStatus }) {
  const badge = CONTRACT_STATUS_BADGES[status]
  return (
    <Badge variant="outline" className={cn('whitespace-nowrap', badge.className)}>
      {badge.label}
    </Badge>
  )
}
