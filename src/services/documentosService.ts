import type { DocumentoInsert, DocumentoRow, DocumentoUpdate } from '@/types/database'
import { asRow, asRowOrNull, asRows, currentUserId, supabase, toDbError, usingDatabase } from './db'
import { demoDocumentos } from './demoSeed'
import { demoDelete, demoFind, demoInsert, demoList, demoPatch } from './demoCrud'
import { demoId, nowIso } from './demoStore'

const KEY = 'documentos'

export type NovoDocumento = Omit<DocumentoInsert, 'user_id'>

export async function listDocumentos(filtro?: {
  clienteId?: string
  tipo?: DocumentoRow['tipo']
}): Promise<DocumentoRow[]> {
  if (!usingDatabase) {
    let rows = demoList(KEY, demoDocumentos)
    if (filtro?.clienteId) rows = rows.filter((r) => r.cliente_id === filtro.clienteId)
    if (filtro?.tipo) rows = rows.filter((r) => r.tipo === filtro.tipo)
    return rows.sort((a, b) => b.created_at.localeCompare(a.created_at))
  }
  try {
    let base = supabase.from('documentos').select('*')
    if (filtro?.clienteId) base = base.eq('cliente_id', filtro.clienteId)
    if (filtro?.tipo) base = base.eq('tipo', filtro.tipo)
    const { data, error } = await base.order('created_at', { ascending: false })
    if (error) throw error
    return asRows<DocumentoRow>(data)
  } catch (err) {
    throw toDbError(err, 'Não foi possível carregar os documentos.')
  }
}

export async function getDocumento(id: string): Promise<DocumentoRow | null> {
  if (!usingDatabase) return demoFind(KEY, demoDocumentos, id)
  try {
    const { data, error } = await supabase
      .from('documentos')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    return asRowOrNull<DocumentoRow>(data)
  } catch (err) {
    throw toDbError(err)
  }
}

export async function createDocumento(input: NovoDocumento): Promise<DocumentoRow> {
  const userId = await currentUserId()
  if (!usingDatabase) {
    const row: DocumentoRow = {
      id: demoId(),
      user_id: userId,
      tipo: input.tipo,
      titulo: input.titulo,
      cliente_id: input.cliente_id ?? null,
      servico_id: input.servico_id ?? null,
      orcamento_id: input.orcamento_id ?? null,
      arquivo_url: input.arquivo_url ?? null,
      dados: input.dados ?? null,
      created_at: nowIso(),
    }
    return demoInsert(KEY, demoDocumentos, row)
  }
  try {
    const { data, error } = await supabase
      .from('documentos')
      .insert({ ...input, user_id: userId })
      .select()
      .single()
    if (error) throw error
    return asRow<DocumentoRow>(data)
  } catch (err) {
    throw toDbError(err, 'Não foi possível salvar o documento.')
  }
}

export async function updateDocumento(id: string, patch: DocumentoUpdate): Promise<DocumentoRow> {
  if (!usingDatabase) return demoPatch<DocumentoRow>(KEY, demoDocumentos, id, patch)
  try {
    const { data, error } = await supabase
      .from('documentos')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return asRow<DocumentoRow>(data)
  } catch (err) {
    throw toDbError(err, 'Não foi possível atualizar o documento.')
  }
}

export async function deleteDocumento(id: string): Promise<void> {
  if (!usingDatabase) {
    demoDelete(KEY, demoDocumentos, id)
    return
  }
  try {
    const { error } = await supabase.from('documentos').delete().eq('id', id)
    if (error) throw error
  } catch (err) {
    throw toDbError(err, 'Não foi possível excluir o documento.')
  }
}
