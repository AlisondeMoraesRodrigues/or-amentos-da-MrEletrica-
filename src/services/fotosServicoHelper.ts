import { getUrlFotoServico, listFotosServico } from './fotosServicoService'
import { urlParaDataUrl } from '@/utils/imagem'
import type { FotoServicoRow } from '@/types/database'

/** Fotos de um serviço já convertidas em data URL (para o PDF do relatório). */
export async function getFotoDataUrls(
  servicoId: string,
): Promise<{ row: FotoServicoRow; dataUrl: string }[]> {
  const fotos = await listFotosServico(servicoId)
  const resolvidas = await Promise.all(
    fotos.map(async (row) => {
      const url = await getUrlFotoServico(row.arquivo_path).catch(() => null)
      const dataUrl = url ? await urlParaDataUrl(url) : null
      return dataUrl ? { row, dataUrl } : null
    }),
  )
  return resolvidas.filter((f): f is { row: FotoServicoRow; dataUrl: string } => f !== null)
}
