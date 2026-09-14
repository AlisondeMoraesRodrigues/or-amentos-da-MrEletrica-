import type { FuncionarioInsert, FuncionarioRow, FuncionarioUpdate } from '@/types/database'
import { asRow, asRows, currentUserId, supabase, toDbError, usingDatabase } from './db'
import { demoDelete, demoInsert, demoList, demoPatch } from './demoCrud'
import { demoId, nowIso } from './demoStore'

const KEY = 'funcionarios'
const SEED: FuncionarioRow[] = []

export type NovoFuncionario = Omit<FuncionarioInsert, 'user_id'>

export async function listFuncionarios(filtro?: { apenasAtivos?: boolean }): Promise<FuncionarioRow[]> {
  if (!usingDatabase) {
    let rows = demoList(KEY, SEED)
    if (filtro?.apenasAtivos) rows = rows.filter((r) => r.ativo)
    return rows.sort((a, b) => a.nome.localeCompare(b.nome))
  }
  try {
    const base = supabase.from('funcionarios').select('*')
    const filtered = filtro?.apenasAtivos ? base.eq('ativo', true) : base
    const { data, error } = await filtered.order('nome')
    if (error) throw error
    return asRows<FuncionarioRow>(data)
  } catch (err) {
    throw toDbError(err, 'Não foi possível carregar os funcionários.')
  }
}

export async function createFuncionario(input: NovoFuncionario): Promise<FuncionarioRow> {
  const userId = await currentUserId()
  if (!usingDatabase) {
    const ts = nowIso()
    return demoInsert(KEY, SEED, {
      id: demoId(),
      user_id: userId,
      nome: input.nome,
      valor_diaria: input.valor_diaria ?? 130,
      ativo: input.ativo ?? true,
      created_at: ts,
      updated_at: ts,
    })
  }
  try {
    const { data, error } = await supabase
      .from('funcionarios')
      .insert({ ...input, user_id: userId })
      .select()
      .single()
    if (error) throw error
    return asRow<FuncionarioRow>(data)
  } catch (err) {
    throw toDbError(err, 'Não foi possível salvar o funcionário.')
  }
}

export async function updateFuncionario(id: string, patch: FuncionarioUpdate): Promise<FuncionarioRow> {
  if (!usingDatabase) {
    return demoPatch<FuncionarioRow>(KEY, SEED, id, { ...patch, updated_at: nowIso() })
  }
  try {
    const { data, error } = await supabase
      .from('funcionarios')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return asRow<FuncionarioRow>(data)
  } catch (err) {
    throw toDbError(err, 'Não foi possível atualizar o funcionário.')
  }
}

export async function excluirFuncionario(id: string): Promise<void> {
  if (!usingDatabase) {
    demoDelete(KEY, SEED, id)
    return
  }
  try {
    const { error } = await supabase.from('funcionarios').delete().eq('id', id)
    if (error) throw error
  } catch (err) {
    throw toDbError(err, 'Não foi possível excluir o funcionário.')
  }
}
