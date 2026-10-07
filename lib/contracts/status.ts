import type { ContractStatus } from '@/lib/db/schema'

const NEXT: Record<ContractStatus, readonly ContractStatus[]> = {
  draft: ['sent', 'void'],
  sent: ['signed', 'void'],
  signed: [],
  void: [],
}

export function canTransition(from: ContractStatus, to: ContractStatus) {
  return NEXT[from].includes(to)
}

// Statuses a contract may be in for a move to `to`. Actions put this in the
// UPDATE's WHERE, so the check and the write are one atomic statement.
export function sourcesOf(to: ContractStatus) {
  return (Object.keys(NEXT) as ContractStatus[]).filter(from =>
    canTransition(from, to),
  )
}

export const EDITABLE_STATUSES: ContractStatus[] = ['draft', 'sent']

export function isEditable(status: ContractStatus) {
  return EDITABLE_STATUSES.includes(status)
}

export const CONTRACT_STATUS_BADGES: Record<
  ContractStatus,
  { label: string; className: string }
> = {
  draft: {
    label: 'Rascunho',
    className: 'border-slate-300 bg-white text-slate-700',
  },
  sent: {
    label: 'Aguardando assinatura',
    className: 'border-orange-200 bg-orange-50 text-orange-800',
  },
  signed: {
    label: 'Assinado',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  },
  void: {
    label: 'Anulado',
    className: 'border-slate-200 bg-slate-50 text-slate-500 line-through',
  },
}
