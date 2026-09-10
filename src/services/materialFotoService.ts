import { storageService } from './storageService'

/**
 * Foto do material (Checkpoint 25).
 *
 * Reaproveita o bucket privado `fotos-servicos` (pasta `materiais`) — as
 * políticas de Storage já cobrem `<user_id>/...`. No modo demonstração o
 * arquivo vira data URL no `localStorage` (igual às fotos do serviço).
 */

const BUCKET = 'fotos-servicos' as const

export interface FotoMaterialEnviada {
  foto_path: string
  foto_nome: string
  foto_tipo: string | null
}

export async function enviarFotoMaterial(file: File): Promise<FotoMaterialEnviada> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Envie uma imagem (foto) do material.')
  }
  const enviado = await storageService.upload(BUCKET, file, 'materiais')
  return {
    foto_path: enviado.path,
    foto_nome: enviado.nome,
    foto_tipo: enviado.tipo || null,
  }
}

export function getUrlFotoMaterial(path: string): Promise<string | null> {
  return storageService.getUrl(BUCKET, path)
}

export async function removerFotoMaterial(path: string | null | undefined): Promise<void> {
  if (!path) return
  await storageService.remove(BUCKET, path).catch(() => undefined)
}
