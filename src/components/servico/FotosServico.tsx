import { useRef, useState, type ChangeEvent } from 'react'
import { Card } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { Loading } from '@/components/ui/Loading'
import { useAsync } from '@/hooks/useAsync'
import {
  atualizarFotoServico,
  CATEGORIAS_FOTO,
  CATEGORIA_LABEL,
  enviarFotoServico,
  excluirFotoServico,
  getUrlFotoServico,
  listFotosServico,
} from '@/services/fotosServicoService'
import type { FotoCategoria, FotoServicoRow } from '@/types/database'

interface FotoComUrl {
  foto: FotoServicoRow
  url: string | null
}

export function FotosServico({ servicoId }: { servicoId: string }) {
  const inputsRef = useRef<Record<FotoCategoria, HTMLInputElement | null>>({
    antes: null,
    durante: null,
    depois: null,
  })
  const [enviando, setEnviando] = useState<FotoCategoria | null>(null)
  const [erro, setErro] = useState('')

  const { data, loading, error, reload } = useAsync<FotoComUrl[]>(async () => {
    const fotos = await listFotosServico(servicoId)
    return Promise.all(
      fotos.map(async (foto) => ({
        foto,
        url: await getUrlFotoServico(foto.arquivo_path).catch(() => null),
      })),
    )
  }, [servicoId])

  const itens = data ?? []

  function abrirSeletor(categoria: FotoCategoria) {
    inputsRef.current[categoria]?.click()
  }

  async function handleArquivo(categoria: FotoCategoria, e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setErro('')
    setEnviando(categoria)
    try {
      await enviarFotoServico(file, servicoId, categoria)
      reload()
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível enviar a foto.')
    } finally {
      setEnviando(null)
    }
  }

  async function handleExcluir(id: string) {
    if (!window.confirm('Remover esta foto?')) return
    setErro('')
    try {
      await excluirFotoServico(id)
      reload()
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível remover a foto.')
    }
  }

  async function handleMover(id: string, categoria: FotoCategoria) {
    setErro('')
    try {
      await atualizarFotoServico(id, { categoria })
      reload()
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível mover a foto.')
    }
  }

  return (
    <Card className="space-y-3">
      <h2 className="text-sm font-semibold text-slate-700">Fotos do serviço ({itens.length})</h2>

      {erro && <Alert tone="error">{erro}</Alert>}

      {loading && <Loading label="Carregando fotos…" />}

      {!loading && error && (
        <Alert tone="error">
          {error}{' '}
          <button type="button" onClick={reload} className="font-semibold underline">
            Tentar novamente
          </button>
        </Alert>
      )}

      {!loading &&
        !error &&
        CATEGORIAS_FOTO.map((categoria) => {
          const fotos = itens.filter((i) => i.foto.categoria === categoria)
          return (
            <div key={categoria}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {CATEGORIA_LABEL[categoria]} ({fotos.length})
                </span>
                <button
                  type="button"
                  onClick={() => abrirSeletor(categoria)}
                  disabled={enviando !== null}
                  className="text-xs font-semibold text-brand-600 underline disabled:opacity-50"
                >
                  {enviando === categoria ? 'Enviando…' : '+ Adicionar'}
                </button>
              </div>
              <input
                ref={(el) => {
                  inputsRef.current[categoria] = el
                }}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handleArquivo(categoria, e)}
              />
              {fotos.length === 0 ? (
                <p className="text-xs text-slate-400">Nenhuma foto.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {fotos.map(({ foto, url }) => (
                    <div key={foto.id} className="space-y-1">
                      <div className="relative overflow-hidden rounded-lg bg-slate-100">
                        {url ? (
                          <a href={url} target="_blank" rel="noreferrer">
                            <img
                              src={url}
                              alt={foto.nome_arquivo}
                              className="aspect-square w-full object-cover"
                            />
                          </a>
                        ) : (
                          <div className="aspect-square w-full" />
                        )}
                        <button
                          type="button"
                          onClick={() => handleExcluir(foto.id)}
                          className="absolute right-1 top-1 rounded-md bg-white/90 px-1.5 py-0.5 text-[10px] font-semibold text-red-600"
                        >
                          Excluir
                        </button>
                      </div>
                      <select
                        value={foto.categoria}
                        onChange={(e) => handleMover(foto.id, e.target.value as FotoCategoria)}
                        className="w-full rounded-md border border-slate-200 bg-white px-1 py-0.5 text-[11px] text-slate-600"
                        aria-label="Mover foto de categoria"
                      >
                        {CATEGORIAS_FOTO.map((c) => (
                          <option key={c} value={c}>
                            {CATEGORIA_LABEL[c]}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
    </Card>
  )
}
