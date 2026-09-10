import { useRef, useState, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { Loading } from '@/components/ui/Loading'
import { useAsync } from '@/hooks/useAsync'
import {
  enviarNotaFiscal,
  excluirNotaFiscal,
  getUrlNotaFiscal,
  listNotasFiscais,
} from '@/services/notasFiscaisService'
import type { NotaFiscalRow } from '@/types/database'

interface NotaComUrl {
  nota: NotaFiscalRow
  url: string | null
}

function formatarTamanho(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

const ACEITOS = 'image/*,application/pdf'

export function NotasFiscais({ servicoId }: { servicoId: string }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  const { data, loading, error, reload } = useAsync<NotaComUrl[]>(async () => {
    const notas = await listNotasFiscais({ servicoId })
    return Promise.all(
      notas.map(async (nota) => ({
        nota,
        url: await getUrlNotaFiscal(nota.arquivo_path).catch(() => null),
      })),
    )
  }, [servicoId])

  async function handleArquivo(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setErro('')
    setEnviando(true)
    try {
      await enviarNotaFiscal(file, { servicoId })
      reload()
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível enviar o arquivo.')
    } finally {
      setEnviando(false)
    }
  }

  async function handleExcluir(id: string) {
    if (!window.confirm('Remover esta nota fiscal?')) return
    setErro('')
    try {
      await excluirNotaFiscal(id)
      reload()
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível remover.')
    }
  }

  const itens = data ?? []

  return (
    <Card>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">
          Notas fiscais / cupons ({itens.length})
        </h2>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={enviando}
          className="text-xs font-semibold text-brand-600 underline disabled:opacity-50"
        >
          {enviando ? 'Enviando…' : '+ Enviar'}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACEITOS}
        className="hidden"
        onChange={handleArquivo}
      />

      {erro && <Alert tone="error">{erro}</Alert>}

      {loading && <Loading label="Carregando notas…" />}

      {!loading && error && (
        <Alert tone="error">
          {error}{' '}
          <button type="button" onClick={reload} className="font-semibold underline">
            Tentar novamente
          </button>
        </Alert>
      )}

      {!loading && !error && itens.length === 0 && (
        <p className="text-sm text-slate-400">
          Envie uma foto, imagem ou PDF da nota fiscal ou cupom dos materiais. Depois use
          "Ler itens" para extrair os materiais da nota.
        </p>
      )}

      {!loading && !error && itens.length > 0 && (
        <ul className="divide-y divide-slate-100">
          {itens.map(({ nota, url }) => {
            const isImagem = (nota.tipo_arquivo ?? '').startsWith('image/')
            return (
              <li key={nota.id} className="flex items-center gap-3 py-2">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 text-slate-400">
                  {isImagem && url ? (
                    <img src={url} alt={nota.nome_arquivo} className="h-full w-full object-cover" />
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <path d="M14 2v6h6" />
                    </svg>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-ink-900">{nota.nome_arquivo}</p>
                  <p className="text-xs text-slate-400">
                    {formatarTamanho(nota.tamanho_bytes)}
                    {nota.texto_ocr ? ' · OCR lido' : ''}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3 text-xs font-semibold">
                  <Link
                    to={`/servicos/${servicoId}/notas/${nota.id}/ler`}
                    className="text-brand-600 underline"
                  >
                    Ler itens
                  </Link>
                  {url && (
                    <a href={url} target="_blank" rel="noreferrer" className="text-brand-600 underline">
                      Abrir
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => handleExcluir(nota.id)}
                    className="text-red-600 underline"
                  >
                    Excluir
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
