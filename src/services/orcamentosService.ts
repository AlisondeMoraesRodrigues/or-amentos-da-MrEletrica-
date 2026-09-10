import type { OrcamentoInsert, OrcamentoRow, OrcamentoUpdate } from '@/types/database'
import { asRow, asRowOrNull, asRows, currentUserId, DbError, supabase, toDbError, usingDatabase } from './db'
import { demoOrcamentos } from './demoSeed'
import { demoDelete, demoFind, demoInsert, demoList, demoPatch } from './demoCrud'
import { demoId, nowIso } from './demoStore'
import { getServico } from './servicosService'
import { listMateriais } from './materiaisService'
import { calcularTotalOrcamento, formatarNumeroOrcamento } from '@/utils/orcamento'

const KEY = 'orcamentos'

export type NovoOrcamento = Omit<OrcamentoInsert, 'user_id'>

export async function listOrcamentos(filtro?: { clienteId?: string }): Promise<OrcamentoRow[]> {
  if (!usingDatabase) {
    let rows = demoList(KEY, demoOrcamentos)
    if (filtro?.clienteId) rows = rows.filter((r) => r.cliente_id === filtro.clienteId)
    return rows.sort((a, b) => b.created_at.localeCompare(a.created_at))
  }
  try {
    const base = supabase.from('orcamentos').select('*')
    const filtered = filtro?.clienteId ? base.eq('cliente_id', filtro.clienteId) : base
    const { data, error } = await filtered.order('created_at', { ascending: false })
    if (error) throw error
    return asRows<OrcamentoRow>(data)
  } catch (err) {
    throw toDbError(err, 'Não foi possível carregar os orçamentos.')
  }
}

export async function getOrcamento(id: string): Promise<OrcamentoRow | null> {
  if (!usingDatabase) return demoFind(KEY, demoOrcamentos, id)
  try {
    const { data, error } = await supabase
      .from('orcamentos')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    return asRowOrNull<OrcamentoRow>(data)
  } catch (err) {
    throw toDbError(err)
  }
}

export async function createOrcamento(input: NovoOrcamento): Promise<OrcamentoRow> {
  const userId = await currentUserId()
  if (!usingDatabase) {
    const ts = nowIso()
    const row: OrcamentoRow = {
      id: demoId(),
      user_id: userId,
      cliente_id: input.cliente_id ?? null,
      servico_id: input.servico_id ?? null,
      numero: input.numero,
      status: input.status ?? 'rascunho',
      valor_materiais: input.valor_materiais ?? 0,
      valor_margem_materiais: input.valor_margem_materiais ?? 0,
      valor_mao_de_obra: input.valor_mao_de_obra ?? 0,
      mo_qtd_tecnicos: input.mo_qtd_tecnicos ?? 0,
      mo_horas_tecnicos: input.mo_horas_tecnicos ?? 0,
      mo_valor_hora_tecnico: input.mo_valor_hora_tecnico ?? 0,
      mo_qtd_ajudantes: input.mo_qtd_ajudantes ?? 0,
      mo_horas_ajudantes: input.mo_horas_ajudantes ?? 0,
      mo_valor_hora_ajudante: input.mo_valor_hora_ajudante ?? 0,
      valor_deslocamento: input.valor_deslocamento ?? 0,
      outros_custos: input.outros_custos ?? 0,
      valor_total: input.valor_total ?? 0,
      observacoes: input.observacoes ?? null,
      garantia: input.garantia ?? null,
      forma_pagamento: input.forma_pagamento ?? null,
      validade_data: input.validade_data ?? null,
      created_at: ts,
      updated_at: ts,
    }
    return demoInsert(KEY, demoOrcamentos, row)
  }
  try {
    const { data, error } = await supabase
      .from('orcamentos')
      .insert({ ...input, user_id: userId })
      .select()
      .single()
    if (error) throw error
    return asRow<OrcamentoRow>(data)
  } catch (err) {
    throw toDbError(err, 'Não foi possível salvar o orçamento.')
  }
}

export async function updateOrcamento(id: string, patch: OrcamentoUpdate): Promise<OrcamentoRow> {
  if (!usingDatabase) {
    return demoPatch<OrcamentoRow>(KEY, demoOrcamentos, id, { ...patch, updated_at: nowIso() })
  }
  try {
    const { data, error } = await supabase
      .from('orcamentos')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return asRow<OrcamentoRow>(data)
  } catch (err) {
    throw toDbError(err, 'Não foi possível atualizar o orçamento.')
  }
}

export async function deleteOrcamento(id: string): Promise<void> {
  if (!usingDatabase) {
    demoDelete(KEY, demoOrcamentos, id)
    return
  }
  try {
    const { error } = await supabase.from('orcamentos').delete().eq('id', id)
    if (error) throw error
  } catch (err) {
    throw toDbError(err, 'Não foi possível excluir o orçamento.')
  }
}

/** Próximo número no formato ORC-AAAA-NNN (sequencial por ano, por usuário). */
export async function proximoNumeroOrcamento(): Promise<string> {
  const ano = new Date().getFullYear()
  const prefixo = `ORC-${ano}-`
  const existentes = await listOrcamentos()
  const maiorSeq = existentes
    .map((o) => o.numero)
    .filter((n) => n.startsWith(prefixo))
    .map((n) => Number.parseInt(n.slice(prefixo.length), 10))
    .filter((n) => Number.isFinite(n))
    .reduce((max, n) => Math.max(max, n), 0)
  return formatarNumeroOrcamento(ano, maiorSeq + 1)
}

/** Cria um orçamento em rascunho a partir de um serviço (materiais + mão de obra + custos). */
export async function criarOrcamentoDoServico(servicoId: string): Promise<OrcamentoRow> {
  const servico = await getServico(servicoId)
  if (!servico) throw new DbError('Serviço não encontrado.')

  const materiais = await listMateriais({ servicoId })
  const valorMateriais =
    Math.round(materiais.reduce((s, m) => s + m.valor_custo * m.quantidade, 0) * 100) / 100
  const valorCobrado =
    Math.round(materiais.reduce((s, m) => s + m.valor_cobrado * m.quantidade, 0) * 100) / 100
  const valorMargemMateriais = Math.round((valorCobrado - valorMateriais) * 100) / 100

  const componentes = {
    valorMateriais,
    valorMargemMateriais,
    valorMaoDeObra: servico.valor_mao_de_obra,
    valorDeslocamento: servico.taxa_deslocamento,
    outrosCustos: servico.outros_custos,
  }

  return createOrcamento({
    numero: await proximoNumeroOrcamento(),
    cliente_id: servico.cliente_id,
    servico_id: servico.id,
    status: 'rascunho',
    valor_materiais: valorMateriais,
    valor_margem_materiais: valorMargemMateriais,
    valor_mao_de_obra: servico.valor_mao_de_obra,
    mo_qtd_tecnicos: servico.quantidade_tecnicos,
    mo_horas_tecnicos: servico.horas_trabalhadas,
    mo_valor_hora_tecnico: servico.valor_hora_aplicado,
    mo_qtd_ajudantes: servico.quantidade_ajudantes,
    mo_horas_ajudantes: servico.horas_ajudantes,
    mo_valor_hora_ajudante: servico.valor_hora_ajudante,
    valor_deslocamento: servico.taxa_deslocamento,
    outros_custos: servico.outros_custos,
    valor_total: calcularTotalOrcamento(componentes),
  })
}
