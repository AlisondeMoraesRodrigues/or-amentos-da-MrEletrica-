import type {
  ServicoFuncionarioInsert,
  ServicoFuncionarioRow,
  ServicoFuncionarioUpdate,
} from '@/types/database'
import { asRow, asRows, currentUserId, supabase, toDbError, usingDatabase } from './db'
import { demoDelete, demoInsert, demoList, demoPatch } from './demoCrud'
import { demoId, nowIso } from './demoStore'

const KEY = 'servico_funcionarios'
const SEED: ServicoFuncionarioRow[] = []

export type NovaEquipeServico = Omit<ServicoFuncionarioInsert, 'user_id'>

export async function listEquipeServico(servicoId: string): Promise<ServicoFuncionarioRow[]> {
  if (!usingDatabase) {
    return demoList(KEY, SEED)
      .filter((r) => r.servico_id === servicoId)
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
  }
  try {
    const { data, error } = await supabase
      .from('servico_funcionarios')
      .select('*')
      .eq('servico_id', servicoId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return asRows<ServicoFuncionarioRow>(data)
  } catch (err) {
    throw toDbError(err, 'Não foi possível carregar a equipe do serviço.')
  }
}

export async function adicionarEquipeServico(
  input: NovaEquipeServico,
): Promise<ServicoFuncionarioRow> {
  const userId = await currentUserId()
  if (!usingDatabase) {
    const ts = nowIso()
    return demoInsert(KEY, SEED, {
      id: demoId(),
      user_id: userId,
      servico_id: input.servico_id,
      funcionario_id: input.funcionario_id ?? null,
      nome_funcionario: input.nome_funcionario,
      quantidade_dias: input.quantidade_dias ?? 1,
      quantidade_horas: input.quantidade_horas ?? 0,
      valor_diaria_aplicado: input.valor_diaria_aplicado ?? 0,
      custo: input.custo ?? 0,
      created_at: ts,
    })
  }
  try {
    const { data, error } = await supabase
      .from('servico_funcionarios')
      .insert({ ...input, user_id: userId })
      .select()
      .single()
    if (error) throw error
    return asRow<ServicoFuncionarioRow>(data)
  } catch (err) {
    throw toDbError(err, 'Não foi possível adicionar o funcionário ao serviço.')
  }
}

export async function atualizarEquipeServico(
  id: string,
  patch: ServicoFuncionarioUpdate,
): Promise<ServicoFuncionarioRow> {
  if (!usingDatabase) {
    return demoPatch<ServicoFuncionarioRow>(KEY, SEED, id, patch)
  }
  try {
    const { data, error } = await supabase
      .from('servico_funcionarios')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return asRow<ServicoFuncionarioRow>(data)
  } catch (err) {
    throw toDbError(err, 'Não foi possível atualizar o funcionário do serviço.')
  }
}

export async function removerEquipeServico(id: string): Promise<void> {
  if (!usingDatabase) {
    demoDelete(KEY, SEED, id)
    return
  }
  try {
    const { error } = await supabase.from('servico_funcionarios').delete().eq('id', id)
    if (error) throw error
  } catch (err) {
    throw toDbError(err, 'Não foi possível remover o funcionário do serviço.')
  }
}
