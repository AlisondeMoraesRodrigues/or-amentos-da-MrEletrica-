import type { ConfiguracaoRow, ConfiguracaoUpdate } from '@/types/database'
import { asRow, asRowOrNull, currentUserId, supabase, toDbError, usingDatabase } from './db'
import { demoConfiguracao } from './demoSeed'
import { demoReadObject, demoWriteObject, nowIso } from './demoStore'

const KEY = 'configuracao'

/**
 * Configurações da empresa/financeiro/PIX — 1 linha por usuário.
 * No banco, a linha é criada automaticamente no cadastro (trigger handle_new_user).
 */
export async function getConfiguracao(): Promise<ConfiguracaoRow> {
  if (!usingDatabase) {
    return demoReadObject<ConfiguracaoRow>(KEY, demoConfiguracao)
  }
  const userId = await currentUserId()
  try {
    const { data, error } = await supabase
      .from('configuracoes')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    if (error) throw error
    const existing = asRowOrNull<ConfiguracaoRow>(data)
    if (existing) return existing

    // fallback: cria a linha padrão caso o trigger não tenha rodado
    const { data: created, error: insertError } = await supabase
      .from('configuracoes')
      .insert({ user_id: userId })
      .select()
      .single()
    if (insertError) throw insertError
    return asRow<ConfiguracaoRow>(created)
  } catch (err) {
    throw toDbError(err, 'Não foi possível carregar as configurações.')
  }
}

export async function updateConfiguracao(patch: ConfiguracaoUpdate): Promise<ConfiguracaoRow> {
  if (!usingDatabase) {
    const atual = demoReadObject<ConfiguracaoRow>(KEY, demoConfiguracao)
    const next: ConfiguracaoRow = { ...atual, ...patch, updated_at: nowIso() }
    demoWriteObject(KEY, next)
    return next
  }
  const userId = await currentUserId()
  try {
    const { data, error } = await supabase
      .from('configuracoes')
      .update(patch)
      .eq('user_id', userId)
      .select()
      .single()
    if (error) throw error
    return asRow<ConfiguracaoRow>(data)
  } catch (err) {
    throw toDbError(err, 'Não foi possível salvar as configurações.')
  }
}
