import { describe, expect, it } from 'vitest'
import { canTransition, isEditable, sourcesOf } from '@/lib/contracts/status'
import type { ContractStatus } from '@/lib/db/schema'

const ALL: ContractStatus[] = ['draft', 'sent', 'signed', 'void']

describe('canTransition', () => {
  it('allows exactly the four lifecycle moves', () => {
    const allowed = ALL.flatMap(from =>
      ALL.filter(to => canTransition(from, to)).map(to => `${from}->${to}`),
    )
    expect(allowed).toEqual([
      'draft->sent',
      'draft->void',
      'sent->signed',
      'sent->void',
    ])
  })

  it('never leaves signed or void', () => {
    expect(ALL.some(to => canTransition('signed', to))).toBe(false)
    expect(ALL.some(to => canTransition('void', to))).toBe(false)
  })
})

describe('sourcesOf', () => {
  it('lists the statuses each move may start from', () => {
    expect(sourcesOf('sent')).toEqual(['draft'])
    expect(sourcesOf('signed')).toEqual(['sent'])
    expect(sourcesOf('void')).toEqual(['draft', 'sent'])
    expect(sourcesOf('draft')).toEqual([])
  })
})

describe('isEditable', () => {
  it('allows edits only before signing', () => {
    expect(ALL.filter(isEditable)).toEqual(['draft', 'sent'])
  })
})
