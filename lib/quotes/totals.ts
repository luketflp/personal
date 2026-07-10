export type TotalsInput = {
  quantity: string | number
  unitPriceCents: number
}

// Totals are always derived (never stored) to avoid drift with the line items.
export function computeTotals(items: TotalsInput[], discountCents = 0) {
  const subtotalCents = items.reduce(
    (sum, it) => sum + Math.round(Number(it.quantity) * it.unitPriceCents),
    0,
  )
  return {
    subtotalCents,
    totalCents: Math.max(0, subtotalCents - discountCents),
  }
}
