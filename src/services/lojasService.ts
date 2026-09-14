import type { LojaRow } from '@/types/database'
import { asRow, asRows, currentUserId, supabase, toDbError, usingDatabase } from './db'
import { demoDelete, demoInsert, demoList } from './demoCrud'
import { demoId, nowIso } from './demoStore'

const KEY = 'lojas'
const SEED: LojaRow[] = []

export async function listLojas(): Promise<LojaRow[]> {
  if (!usingDatabase) {
    return demoList(KEY, SEED).sort((a, b) => a.nome.localeCompare(b.nome))
  }
  try {
    const { data, error } = await supabase.from('lojas').select('*').order('nome')
    if (error) throw error
    return asRows<LojaRow>(data)
  } catch (err) {
    throw toDbError(err, 'Não foi possível carregar as lojas.')
  }
}

/** Acha a loja pelo nome (sem diferenciar maiúsculas) ou cria uma nova. */
export async function encontrarOuCriarLoja(nome: string, cnpj?: string | null): Promise<LojaRow> {
  const nomeNormalizado = nome.trim()
  const userId = await currentUserId()
  const existentes = await listLojas()
  const existente = existentes.find(
    (l) => l.nome.trim().toLowerCase() === nomeNormalizado.toLowerCase(),
  )
  if (existente) return existente

  if (!usingDatabase) {
    const ts = nowIso()
    const row: LojaRow = {
      id: demoId(),
      user_id: userId,
      nome: nomeNormalizado,
      cnpj: cnpj ?? null,
      created_at: ts,
      updated_at: ts,
    }
    return demoInsert(KEY, SEED, row)
  }
  try {
    const { data, error } = await supabase
      .from('lojas')
      .insert({ user_id: userId, nome: nomeNormalizado, cnpj: cnpj ?? null })
      .select()
      .single()
    if (error) throw error
    return asRow<LojaRow>(data)
  } catch (err) {
    throw toDbError(err, 'Não foi possível salvar a loja.')
  }
}

export async function excluirLoja(id: string): Promise<void> {
  if (!usingDatabase) {
    demoDelete(KEY, SEED, id)
    return
  }
  try {
    const { error } = await supabase.from('lojas').delete().eq('id', id)
    if (error) throw error
  } catch (err) {
    throw toDbError(err, 'Não foi possível excluir a loja.')
  }
}
