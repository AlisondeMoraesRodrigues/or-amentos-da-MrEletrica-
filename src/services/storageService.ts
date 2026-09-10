import { currentUserId, DbError, supabase, toDbError, usingDatabase } from './db'
import { demoId } from './demoStore'

/**
 * Camada de armazenamento de arquivos (Checkpoints 09 e 11).
 *
 * - MODO PRODUÇÃO: Supabase Storage (buckets privados, RLS por usuário).
 * - MODO DEMONSTRAÇÃO: o arquivo é convertido em data URL e guardado no
 *   `localStorage` (limite de ~2 MB); nada é enviado a servidor.
 *
 * Buckets usados: `notas-fiscais` (CP09), `fotos-servicos` (CP11).
 */

const DEMO_PREFIX = 'mr-demo-file-'
const DEMO_MAX_BYTES = 2 * 1024 * 1024

export type StorageBucket = 'notas-fiscais' | 'fotos-servicos'

export interface ArquivoEnviado {
  path: string
  nome: string
  tipo: string
  tamanho: number
}

function extensao(nome: string): string {
  const m = /\.([a-z0-9]+)$/i.exec(nome)
  return m ? m[1].toLowerCase() : 'bin'
}

function lerComoDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new DbError('Não foi possível ler o arquivo.'))
    reader.readAsDataURL(file)
  })
}

export const storageService = {
  async upload(bucket: StorageBucket, file: File, pasta: string): Promise<ArquivoEnviado> {
    if (!usingDatabase) {
      if (file.size > DEMO_MAX_BYTES) {
        throw new DbError(
          'No modo demonstração o arquivo deve ter até 2 MB. Configure o Supabase para arquivos maiores.',
        )
      }
      const id = demoId()
      try {
        window.localStorage.setItem(DEMO_PREFIX + id, await lerComoDataUrl(file))
      } catch {
        throw new DbError('Armazenamento local cheio. Remova alguns arquivos e tente novamente.')
      }
      return { path: `demo/${id}`, nome: file.name, tipo: file.type, tamanho: file.size }
    }

    const userId = await currentUserId()
    const caminho = `${userId}/${pasta}/${demoId()}.${extensao(file.name)}`
    try {
      const { error } = await supabase.storage.from(bucket).upload(caminho, file, {
        contentType: file.type || undefined,
        upsert: false,
      })
      if (error) throw error
      return { path: caminho, nome: file.name, tipo: file.type, tamanho: file.size }
    } catch (err) {
      throw toDbError(err, 'Não foi possível enviar o arquivo.')
    }
  },

  /** URL exibível do arquivo (data URL no demo; URL assinada no Supabase). */
  async getUrl(bucket: StorageBucket, path: string): Promise<string | null> {
    if (path.startsWith('demo/')) {
      try {
        return window.localStorage.getItem(DEMO_PREFIX + path.slice('demo/'.length))
      } catch {
        return null
      }
    }
    try {
      const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 3600)
      if (error) throw error
      return data.signedUrl
    } catch (err) {
      throw toDbError(err, 'Não foi possível abrir o arquivo.')
    }
  },

  async remove(bucket: StorageBucket, path: string): Promise<void> {
    if (path.startsWith('demo/')) {
      try {
        window.localStorage.removeItem(DEMO_PREFIX + path.slice('demo/'.length))
      } catch {
        /* ignora */
      }
      return
    }
    try {
      const { error } = await supabase.storage.from(bucket).remove([path])
      if (error) throw error
    } catch (err) {
      throw toDbError(err, 'Não foi possível remover o arquivo.')
    }
  },
}
