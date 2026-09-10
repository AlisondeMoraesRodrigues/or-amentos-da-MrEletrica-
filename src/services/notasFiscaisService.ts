import type { NotaFiscalRow } from '@/types/database'
import { asRow, asRowOrNull, asRows, currentUserId, supabase, toDbError, usingDatabase } from './db'
import { demoDelete, demoFind, demoInsert, demoList, demoPatch } from './demoCrud'
import { demoId, nowIso } from './demoStore'
import { storageService } from './storageService'

const KEY = 'notas_fiscais'
const SEED: NotaFiscalRow[] = []

export async function listNotasFiscais(filtro: {
  servicoId?: string
  orcamentoId?: string
}): Promise<NotaFiscalRow[]> {
  if (!usingDatabase) {
    let rows = demoList(KEY, SEED)
    if (filtro.servicoId) rows = rows.filter((r) => r.servico_id === filtro.servicoId)
    if (filtro.orcamentoId) rows = rows.filter((r) => r.orcamento_id === filtro.orcamentoId)
    return rows.sort((a, b) => b.created_at.localeCompare(a.created_at))
  }
  try {
    const base = supabase.from('notas_fiscais').select('*')
    const filtered = filtro.servicoId
      ? base.eq('servico_id', filtro.servicoId)
      : filtro.orcamentoId
        ? base.eq('orcamento_id', filtro.orcamentoId)
        : base
    const { data, error } = await filtered.order('created_at', { ascending: false })
    if (error) throw error
    return asRows<NotaFiscalRow>(data)
  } catch (err) {
    throw toDbError(err, 'Não foi possível carregar as notas fiscais.')
  }
}

/** Envia o arquivo para o armazenamento e cria o registro da nota. */
export async function enviarNotaFiscal(
  file: File,
  vinculo: { servicoId?: string; orcamentoId?: string },
): Promise<NotaFiscalRow> {
  const userId = await currentUserId()
  const pasta = vinculo.servicoId ?? vinculo.orcamentoId ?? 'sem-vinculo'
  const enviado = await storageService.upload('notas-fiscais', file, pasta)

  if (!usingDatabase) {
    const row: NotaFiscalRow = {
      id: demoId(),
      user_id: userId,
      servico_id: vinculo.servicoId ?? null,
      orcamento_id: vinculo.orcamentoId ?? null,
      arquivo_path: enviado.path,
      nome_arquivo: enviado.nome,
      tipo_arquivo: enviado.tipo || null,
      tamanho_bytes: enviado.tamanho,
      texto_ocr: null,
      processado_em: null,
      created_at: nowIso(),
    }
    return demoInsert(KEY, SEED, row)
  }

  try {
    const { data, error } = await supabase
      .from('notas_fiscais')
      .insert({
        user_id: userId,
        servico_id: vinculo.servicoId ?? null,
        orcamento_id: vinculo.orcamentoId ?? null,
        arquivo_path: enviado.path,
        nome_arquivo: enviado.nome,
        tipo_arquivo: enviado.tipo || null,
        tamanho_bytes: enviado.tamanho,
      })
      .select()
      .single()
    if (error) throw error
    return asRow<NotaFiscalRow>(data)
  } catch (err) {
    // desfaz o upload se o registro falhar
    await storageService.remove('notas-fiscais', enviado.path).catch(() => undefined)
    throw toDbError(err, 'Não foi possível registrar a nota fiscal.')
  }
}

export async function getUrlNotaFiscal(path: string): Promise<string | null> {
  return storageService.getUrl('notas-fiscais', path)
}

export async function getNotaFiscal(id: string): Promise<NotaFiscalRow | null> {
  if (!usingDatabase) return demoFind(KEY, SEED, id)
  try {
    const { data, error } = await supabase
      .from('notas_fiscais')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    return asRowOrNull<NotaFiscalRow>(data)
  } catch (err) {
    throw toDbError(err)
  }
}

/** Grava o texto lido da nota (informado ou por OCR) e marca como processada. */
export async function atualizarTextoOcr(id: string, texto: string): Promise<NotaFiscalRow> {
  const patch = { texto_ocr: texto, processado_em: nowIso() }
  if (!usingDatabase) {
    return demoPatch<NotaFiscalRow>(KEY, SEED, id, patch)
  }
  try {
    const { data, error } = await supabase
      .from('notas_fiscais')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return asRow<NotaFiscalRow>(data)
  } catch (err) {
    throw toDbError(err, 'Não foi possível salvar o texto da nota.')
  }
}

export async function excluirNotaFiscal(id: string): Promise<void> {
  if (!usingDatabase) {
    const nota = demoFind(KEY, SEED, id)
    if (nota) await storageService.remove('notas-fiscais', nota.arquivo_path)
    demoDelete(KEY, SEED, id)
    return
  }
  try {
    const { data, error } = await supabase
      .from('notas_fiscais')
      .select('arquivo_path')
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    if (data?.arquivo_path) await storageService.remove('notas-fiscais', data.arquivo_path).catch(() => undefined)
    const { error: delError } = await supabase.from('notas_fiscais').delete().eq('id', id)
    if (delError) throw delError
  } catch (err) {
    throw toDbError(err, 'Não foi possível excluir a nota fiscal.')
  }
}
