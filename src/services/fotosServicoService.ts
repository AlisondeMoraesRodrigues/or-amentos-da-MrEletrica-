import type { FotoCategoria, FotoServicoRow } from '@/types/database'
import { asRow, asRows, currentUserId, supabase, toDbError, usingDatabase } from './db'
import { demoDelete, demoFind, demoInsert, demoList, demoPatch } from './demoCrud'
import { demoId, nowIso } from './demoStore'
import { storageService } from './storageService'

const KEY = 'fotos_servico'
const SEED: FotoServicoRow[] = []
const BUCKET = 'fotos-servicos' as const

export const CATEGORIAS_FOTO: FotoCategoria[] = ['antes', 'durante', 'depois']
export const CATEGORIA_LABEL: Record<FotoCategoria, string> = {
  antes: 'Antes',
  durante: 'Durante',
  depois: 'Depois',
}

export async function listFotosServico(servicoId: string): Promise<FotoServicoRow[]> {
  if (!usingDatabase) {
    return demoList(KEY, SEED)
      .filter((f) => f.servico_id === servicoId)
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
  }
  try {
    const { data, error } = await supabase
      .from('fotos_servico')
      .select('*')
      .eq('servico_id', servicoId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return asRows<FotoServicoRow>(data)
  } catch (err) {
    throw toDbError(err, 'Não foi possível carregar as fotos.')
  }
}

export async function enviarFotoServico(
  file: File,
  servicoId: string,
  categoria: FotoCategoria,
): Promise<FotoServicoRow> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Envie uma imagem (foto).')
  }
  const userId = await currentUserId()
  const enviado = await storageService.upload(BUCKET, file, `${servicoId}/${categoria}`)

  if (!usingDatabase) {
    const row: FotoServicoRow = {
      id: demoId(),
      user_id: userId,
      servico_id: servicoId,
      categoria,
      arquivo_path: enviado.path,
      nome_arquivo: enviado.nome,
      tipo_arquivo: enviado.tipo || null,
      tamanho_bytes: enviado.tamanho,
      legenda: null,
      created_at: nowIso(),
    }
    return demoInsert(KEY, SEED, row)
  }

  try {
    const { data, error } = await supabase
      .from('fotos_servico')
      .insert({
        user_id: userId,
        servico_id: servicoId,
        categoria,
        arquivo_path: enviado.path,
        nome_arquivo: enviado.nome,
        tipo_arquivo: enviado.tipo || null,
        tamanho_bytes: enviado.tamanho,
      })
      .select()
      .single()
    if (error) throw error
    return asRow<FotoServicoRow>(data)
  } catch (err) {
    await storageService.remove(BUCKET, enviado.path).catch(() => undefined)
    throw toDbError(err, 'Não foi possível registrar a foto.')
  }
}

export async function getUrlFotoServico(path: string): Promise<string | null> {
  return storageService.getUrl(BUCKET, path)
}

export async function atualizarFotoServico(
  id: string,
  patch: { categoria?: FotoCategoria; legenda?: string | null },
): Promise<FotoServicoRow> {
  if (!usingDatabase) {
    return demoPatch<FotoServicoRow>(KEY, SEED, id, patch)
  }
  try {
    const { data, error } = await supabase
      .from('fotos_servico')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return asRow<FotoServicoRow>(data)
  } catch (err) {
    throw toDbError(err, 'Não foi possível atualizar a foto.')
  }
}

export async function excluirFotoServico(id: string): Promise<void> {
  if (!usingDatabase) {
    const foto = demoFind(KEY, SEED, id)
    if (foto) await storageService.remove(BUCKET, foto.arquivo_path)
    demoDelete(KEY, SEED, id)
    return
  }
  try {
    const { data, error } = await supabase
      .from('fotos_servico')
      .select('arquivo_path')
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    if (data?.arquivo_path) await storageService.remove(BUCKET, data.arquivo_path).catch(() => undefined)
    const { error: delError } = await supabase.from('fotos_servico').delete().eq('id', id)
    if (delError) throw delError
  } catch (err) {
    throw toDbError(err, 'Não foi possível excluir a foto.')
  }
}
