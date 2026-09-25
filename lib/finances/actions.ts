'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { financeEntries, projects } from '@/lib/db/schema'
import { financeEntrySchema, projectSchema } from '@/lib/finances/validation'

type ActionResult = { ok: true } | { ok: false; error: string }

function revalidateFinances() {
  revalidatePath('/dashboard/finances', 'layout')
}

export async function createFinanceEntry(
  input: unknown,
): Promise<ActionResult> {
  const parsed = financeEntrySchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Dados inválidos' }

  try {
    const data = parsed.data
    await db.insert(financeEntries).values({
      ...data,
      description: data.description || null,
    })
    revalidateFinances()
    return { ok: true }
  } catch {
    return { ok: false, error: 'Não foi possível salvar o lançamento' }
  }
}

export async function updateFinanceEntry(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  const parsed = financeEntrySchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Dados inválidos' }

  try {
    const data = parsed.data
    await db
      .update(financeEntries)
      .set({
        ...data,
        description: data.description || null,
        updatedAt: new Date(),
      })
      .where(eq(financeEntries.id, id))
    revalidateFinances()
    return { ok: true }
  } catch {
    return { ok: false, error: 'Não foi possível atualizar o lançamento' }
  }
}

export async function deleteFinanceEntry(id: string): Promise<ActionResult> {
  try {
    await db.delete(financeEntries).where(eq(financeEntries.id, id))
    revalidateFinances()
    return { ok: true }
  } catch {
    return { ok: false, error: 'Não foi possível excluir o lançamento' }
  }
}

export async function createProject(input: unknown): Promise<ActionResult> {
  const parsed = projectSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Dados inválidos' }

  try {
    await db.insert(projects).values(parsed.data)
    revalidateFinances()
    return { ok: true }
  } catch (error) {
    const isUnique =
      error instanceof Error && 'code' in error && error.code === '23505'
    return {
      ok: false,
      error: isUnique
        ? 'Já existe um projeto com esse nome'
        : 'Não foi possível criar o projeto',
    }
  }
}
