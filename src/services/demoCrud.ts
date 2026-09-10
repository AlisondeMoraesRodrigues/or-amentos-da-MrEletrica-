import { demoRead, demoWrite } from './demoStore'

/**
 * CRUD genérico sobre o `demoStore` (modo demonstração).
 * O chamador monta a linha completa (usando `demoId()` / `nowIso()`);
 * aqui só cuidamos da leitura/gravação da coleção.
 */

interface HasId {
  id: string
}

export function demoList<T>(key: string, seed: T[]): T[] {
  return demoRead<T>(key, seed)
}

export function demoFind<T extends HasId>(key: string, seed: T[], id: string): T | null {
  return demoRead<T>(key, seed).find((row) => row.id === id) ?? null
}

export function demoInsert<T extends HasId>(key: string, seed: T[], row: T): T {
  demoWrite(key, [row, ...demoRead<T>(key, seed)])
  return row
}

export function demoPatch<T extends HasId>(
  key: string,
  seed: T[],
  id: string,
  patch: Partial<T>,
): T {
  const rows = demoRead<T>(key, seed)
  const index = rows.findIndex((row) => row.id === id)
  if (index === -1) throw new Error('Registro não encontrado.')
  const updated = { ...rows[index], ...patch }
  rows[index] = updated
  demoWrite(key, rows)
  return updated
}

export function demoDelete<T extends HasId>(key: string, seed: T[], id: string): void {
  demoWrite(
    key,
    demoRead<T>(key, seed).filter((row) => row.id !== id),
  )
}
