import type { MaterialInsert, MaterialRow, MaterialUpdate } from '@/types/database'
import { asRow, asRowOrNull, asRows, currentUserId, supabase, toDbError, usingDatabase } from './db'
import { demoMateriais } from './demoSeed'
import { demoDelete, demoFind, demoInsert, demoList, demoPatch } from './demoCrud'
import { demoId, nowIso } from './demoStore'
import { removerFotoMaterial } from './materialFotoService'

const KEY = 'materiais'

export type NovoMaterial = Omit<MaterialInsert, 'user_id'>

export async function listMateriais(filtro?: {
  servicoId?: string
  orcamentoId?: string
}): Promise<MaterialRow[]> {
  if (!usingDatabase) {
    let rows = demoList(KEY, demoMateriais)
    if (filtro?.servicoId) rows = rows.filter((r) => r.servico_id === filtro.servicoId)
    if (filtro?.orcamentoId) rows = rows.filter((r) => r.orcamento_id === filtro.orcamentoId)
    return rows
  }
  try {
    let base = supabase.from('materiais').select('*')
    if (filtro?.servicoId) base = base.eq('servico_id', filtro.servicoId)
    if (filtro?.orcamentoId) base = base.eq('orcamento_id', filtro.orcamentoId)
    const { data, error } = await base.order('created_at', { ascending: true })
    if (error) throw error
    return asRows<MaterialRow>(data)
  } catch (err) {
    throw toDbError(err, 'Não foi possível carregar os materiais.')
  }
}

export async function getMaterial(id: string): Promise<MaterialRow | null> {
  if (!usingDatabase) return demoFind(KEY, demoMateriais, id)
  try {
    const { data, error } = await supabase
      .from('materiais')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    return asRowOrNull<MaterialRow>(data)
  } catch (err) {
    throw toDbError(err)
  }
}

export async function createMaterial(input: NovoMaterial): Promise<MaterialRow> {
  const userId = await currentUserId()
  if (!usingDatabase) {
    const ts = nowIso()
    const row: MaterialRow = {
      id: demoId(),
      user_id: userId,
      servico_id: input.servico_id ?? null,
      orcamento_id: input.orcamento_id ?? null,
      nome: input.nome,
      quantidade: input.quantidade ?? 1,
      unidade: input.unidade ?? 'un',
      valor_custo: input.valor_custo ?? 0,
      margem_percentual: input.margem_percentual ?? 20,
      valor_cobrado: input.valor_cobrado ?? 0,
      foto_path: input.foto_path ?? null,
      foto_nome: input.foto_nome ?? null,
      foto_tipo: input.foto_tipo ?? null,
      created_at: ts,
      updated_at: ts,
    }
    return demoInsert(KEY, demoMateriais, row)
  }
  try {
    const { data, error } = await supabase
      .from('materiais')
      .insert({ ...input, user_id: userId })
      .select()
      .single()
    if (error) throw error
    return asRow<MaterialRow>(data)
  } catch (err) {
    throw toDbError(err, 'Não foi possível salvar o material.')
  }
}

export async function updateMaterial(id: string, patch: MaterialUpdate): Promise<MaterialRow> {
  if (!usingDatabase) {
    return demoPatch<MaterialRow>(KEY, demoMateriais, id, { ...patch, updated_at: nowIso() })
  }
  try {
    const { data, error } = await supabase
      .from('materiais')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return asRow<MaterialRow>(data)
  } catch (err) {
    throw toDbError(err, 'Não foi possível atualizar o material.')
  }
}

export async function deleteMaterial(id: string): Promise<void> {
  if (!usingDatabase) {
    const m = demoFind(KEY, demoMateriais, id)
    await removerFotoMaterial(m?.foto_path)
    demoDelete(KEY, demoMateriais, id)
    return
  }
  try {
    const { data } = await supabase
      .from('materiais')
      .select('foto_path')
      .eq('id', id)
      .maybeSingle()
    const { error } = await supabase.from('materiais').delete().eq('id', id)
    if (error) throw error
    await removerFotoMaterial((data as { foto_path?: string | null } | null)?.foto_path)
  } catch (err) {
    throw toDbError(err, 'Não foi possível excluir o material.')
  }
}
