import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { setOCRProvider, type NotaLida } from './ocrService'

/**
 * Registra a leitura automática de foto/PDF de nota (Checkpoint 28) quando o
 * Supabase está configurado — chama a Edge Function `ler-nota` (Gemini).
 *
 * Se a função não estiver publicada (ou faltar a chave), ela responde
 * `ok: false` e o app cai no fluxo manual — por isso é seguro registrar
 * sempre. Importado uma vez em `src/main.tsx`.
 */

function paraBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const resultado = String(reader.result)
      resolve(resultado.slice(resultado.indexOf(',') + 1))
    }
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'))
    reader.readAsDataURL(blob)
  })
}

if (isSupabaseConfigured) {
  setOCRProvider({
    nome: 'edge',
    async lerEstruturado(arquivo: Blob): Promise<NotaLida> {
      const imagemBase64 = await paraBase64(arquivo)
      const mimeType = arquivo.type || 'image/jpeg'
      const { data, error } = await supabase.functions.invoke('ler-nota', {
        body: { imagemBase64, mimeType },
      })
      if (error) throw error
      if (!data?.ok) {
        throw new Error(
          data?.motivo === 'sem_chave'
            ? 'Leitura automática não configurada.'
            : 'Não foi possível ler a nota automaticamente.',
        )
      }
      return data.dados as NotaLida
    },
  })
}
