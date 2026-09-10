import type { ServicoInsert, ServicoRow, ServicoUpdate } from '@/types/database'
import { asRow, asRowOrNull, asRows, currentUserId, supabase, toDbError, usingDatabase } from './db'
import { demoServicos } from './demoSeed'
import { demoDelete, demoFind, demoInsert, demoList, demoPatch } from './demoCrud'
import { demoId, nowIso } from './demoStore'

const KEY = 'servicos'

export type NovoServico = Omit<ServicoInsert, 'user_id'>

export async function listServicos(filtro?: { clienteId?: string }): Promise<ServicoRow[]> {
  if (!usingDatabase) {
    let rows = demoList(KEY, demoServicos)
    if (filtro?.clienteId) rows = rows.filter((r) => r.cliente_id === filtro.clienteId)
    return rows.sort((a, b) => b.created_at.localeCompare(a.created_at))
  }
  try {
    const base = supabase.from('servicos').select('*')
    const filtered = filtro?.clienteId ? base.eq('cliente_id', filtro.clienteId) : base
    const { data, error } = await filtered.order('created_at', { ascending: false })
    if (error) throw error
    return asRows<ServicoRow>(data)
  } catch (err) {
    throw toDbError(err, 'Não foi possível carregar os serviços.')
  }
}

export async function getServico(id: string): Promise<ServicoRow | null> {
  if (!usingDatabase) return demoFind(KEY, demoServicos, id)
  try {
    const { data, error } = await supabase.from('servicos').select('*').eq('id', id).maybeSingle()
    if (error) throw error
    return asRowOrNull<ServicoRow>(data)
  } catch (err) {
    throw toDbError(err)
  }
}

export async function createServico(input: NovoServico): Promise<ServicoRow> {
  const userId = await currentUserId()
  if (!usingDatabase) {
    const ts = nowIso()
    const row: ServicoRow = {
      id: demoId(),
      user_id: userId,
      cliente_id: input.cliente_id ?? null,
      descricao: input.descricao ?? '',
      descricao_livre: input.descricao_livre ?? null,
      horas_trabalhadas: input.horas_trabalhadas ?? 0,
      quantidade_tecnicos: input.quantidade_tecnicos ?? 1,
      tipo_hora: input.tipo_hora ?? 'tecnica',
      valor_hora_aplicado: input.valor_hora_aplicado ?? 0,
      quantidade_ajudantes: input.quantidade_ajudantes ?? 0,
      horas_ajudantes: input.horas_ajudantes ?? 0,
      valor_hora_ajudante: input.valor_hora_ajudante ?? 0,
      valor_mao_de_obra: input.valor_mao_de_obra ?? 0,
      taxa_deslocamento: input.taxa_deslocamento ?? 0,
      outros_custos: input.outros_custos ?? 0,
      status: input.status ?? 'aberto',
      data_servico: input.data_servico ?? null,
      created_at: ts,
      updated_at: ts,
    }
    return demoInsert(KEY, demoServicos, row)
  }
  try {
    const { data, error } = await supabase
      .from('servicos')
      .insert({ ...input, user_id: userId })
      .select()
      .single()
    if (error) throw error
    return asRow<ServicoRow>(data)
  } catch (err) {
    throw toDbError(err, 'Não foi possível salvar o serviço.')
  }
}

export async function updateServico(id: string, patch: ServicoUpdate): Promise<ServicoRow> {
  if (!usingDatabase) {
    return demoPatch<ServicoRow>(KEY, demoServicos, id, { ...patch, updated_at: nowIso() })
  }
  try {
    const { data, error } = await supabase
      .from('servicos')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return asRow<ServicoRow>(data)
  } catch (err) {
    throw toDbError(err, 'Não foi possível atualizar o serviço.')
  }
}

export async function deleteServico(id: string): Promise<void> {
  if (!usingDatabase) {
    demoDelete(KEY, demoServicos, id)
    return
  }
  try {
    const { error } = await supabase.from('servicos').delete().eq('id', id)
    if (error) throw error
  } catch (err) {
    throw toDbError(err, 'Não foi possível excluir o serviço.')
  }
}
