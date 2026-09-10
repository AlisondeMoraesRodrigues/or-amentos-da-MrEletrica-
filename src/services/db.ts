import { isSupabaseConfigured, supabase } from '@/lib/supabase'

/**
 * Base da camada de acesso a dados (Checkpoint 03).
 * Cada service usa o Supabase quando configurado e o armazém local
 * (`demoStore`) no modo demonstração.
 *
 * O cliente Supabase não é tipado com o schema (`Database`) por enquanto — os
 * tipos das linhas vêm de `src/types/database.ts` e são aplicados por cast nos
 * services. Quando o Supabase estiver conectado, rode
 * `supabase gen types typescript` e tipe o cliente para checagem completa.
 */

export const usingDatabase = isSupabaseConfigured

export class DbError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DbError'
  }
}

/** ID do usuário autenticado (para preencher `user_id` nos inserts). */
export async function currentUserId(): Promise<string> {
  if (!isSupabaseConfigured) return 'demo-user'
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) {
    throw new DbError('Sessão expirada. Faça login novamente.')
  }
  return data.user.id
}

/** Normaliza um erro do Supabase para `DbError` com mensagem em português. */
export function toDbError(err: unknown, fallback = 'Falha ao acessar o banco de dados.'): DbError {
  if (err instanceof DbError) return err
  const msg = (err as { message?: string } | null)?.message ?? ''
  if (/duplicate key|already exists/i.test(msg)) return new DbError('Registro duplicado.')
  if (/violates foreign key/i.test(msg)) return new DbError('Registro vinculado a outro item.')
  if (/row-level security|permission denied/i.test(msg))
    return new DbError('Você não tem permissão para esta operação.')
  if (/failed to fetch|network/i.test(msg))
    return new DbError('Falha de conexão. Verifique sua internet.')
  return new DbError(fallback)
}

/** Converte o `data` de um `.select()` (tipado como any pelo cliente sem schema). */
export function asRows<T>(data: unknown): T[] {
  return (data ?? []) as T[]
}
export function asRow<T>(data: unknown): T {
  return data as T
}
export function asRowOrNull<T>(data: unknown): T | null {
  return (data ?? null) as T | null
}

export { supabase }
