import type { ClienteInsert, ClienteRow, ClienteUpdate } from '@/types/database'
import { asRow, asRowOrNull, asRows, currentUserId, supabase, toDbError, usingDatabase } from './db'
import { demoClientes } from './demoSeed'
import { demoDelete, demoFind, demoInsert, demoList, demoPatch } from './demoCrud'
import { demoId, nowIso } from './demoStore'

const KEY = 'clientes'

export type NovoCliente = Omit<ClienteInsert, 'user_id'>

export async function listClientes(): Promise<ClienteRow[]> {
  if (!usingDatabase) {
    return demoList(KEY, demoClientes).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  }
  try {
    const { data, error } = await supabase.from('clientes').select('*').order('nome')
    if (error) throw error
    return asRows<ClienteRow>(data)
  } catch (err) {
    throw toDbError(err, 'Não foi possível carregar os clientes.')
  }
}

export async function getCliente(id: string): Promise<ClienteRow | null> {
  if (!usingDatabase) return demoFind(KEY, demoClientes, id)
  try {
    const { data, error } = await supabase.from('clientes').select('*').eq('id', id).maybeSingle()
    if (error) throw error
    return asRowOrNull<ClienteRow>(data)
  } catch (err) {
    throw toDbError(err)
  }
}

export async function createCliente(input: NovoCliente): Promise<ClienteRow> {
  const userId = await currentUserId()
  if (!usingDatabase) {
    const ts = nowIso()
    const row: ClienteRow = {
      id: demoId(),
      user_id: userId,
      nome: input.nome,
      cpf: input.cpf ?? null,
      cnpj: input.cnpj ?? null,
      telefone: input.telefone ?? null,
      whatsapp: input.whatsapp ?? null,
      email: input.email ?? null,
      endereco: input.endereco ?? null,
      cidade: input.cidade ?? null,
      condominio: input.condominio ?? null,
      responsavel: input.responsavel ?? null,
      observacoes: input.observacoes ?? null,
      created_at: ts,
      updated_at: ts,
    }
    return demoInsert(KEY, demoClientes, row)
  }
  try {
    const { data, error } = await supabase
      .from('clientes')
      .insert({ ...input, user_id: userId })
      .select()
      .single()
    if (error) throw error
    return asRow<ClienteRow>(data)
  } catch (err) {
    throw toDbError(err, 'Não foi possível salvar o cliente.')
  }
}

export async function updateCliente(id: string, patch: ClienteUpdate): Promise<ClienteRow> {
  if (!usingDatabase) {
    return demoPatch<ClienteRow>(KEY, demoClientes, id, { ...patch, updated_at: nowIso() })
  }
  try {
    const { data, error } = await supabase
      .from('clientes')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return asRow<ClienteRow>(data)
  } catch (err) {
    throw toDbError(err, 'Não foi possível atualizar o cliente.')
  }
}

export async function deleteCliente(id: string): Promise<void> {
  if (!usingDatabase) {
    demoDelete(KEY, demoClientes, id)
    return
  }
  try {
    const { error } = await supabase.from('clientes').delete().eq('id', id)
    if (error) throw error
  } catch (err) {
    throw toDbError(err, 'Não foi possível excluir o cliente.')
  }
}
