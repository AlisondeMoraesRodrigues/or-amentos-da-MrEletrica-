import { useRef, useState, type ChangeEvent } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { TextField } from '@/components/ui/TextField'
import { TextAreaField } from '@/components/ui/TextAreaField'
import { SelectField } from '@/components/ui/SelectField'
import { enviarNotaFiscal } from '@/services/notasFiscaisService'
import { registrarCompra, buscarNoCatalogo, precoReferencia } from '@/services/materiaisCatalogoService'
import { createMaterial } from '@/services/materiaisService'
import { OCRService } from '@/services/ocrService'
import { MARGENS_PRESET, UNIDADE_LABEL, UNIDADE_ORDEM } from '@/config/material'
import { aplicarMargem } from '@/utils/margem'
import { formatCurrency, formatNumber } from '@/utils/format'
import { demoId, nowIso } from '@/services/demoStore'
import type { MaterialUnidade, PrecoReferencia } from '@/types/database'

/**
 * Foto da nota → texto → itens conferidos → materiais salvos (Checkpoint 27).
 *
 * Embutido em "Novo serviço": tudo acontece sem sair da tela. O OCR de imagem
 * ainda não está ativado por padrão (`ocrService`, regra 10 — sem serviço
 * pago) — por isso, depois da foto, o texto da nota é digitado/colado e os
 * itens são extraídos por regras (sempre editável antes de salvar).
 */

interface ItemEditavel {
  id: string
  nome: string
  codigo: string
  quantidade: string
  unidade: MaterialUnidade
  valorUnitario: string
  valorSugerido: string
}

function num(v: string): number {
  const n = Number.parseFloat(v.replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

type Etapa = 'inicio' | 'preview' | 'texto' | 'conferencia'

export function NotaMaterialCapture({
  servicoId,
  onNeedServicoId,
  onMateriaisSalvos,
  precoReferenciaConfig,
  margemPadrao,
  lojaPadrao,
}: {
  servicoId: string | null
  onNeedServicoId: () => Promise<string>
  onMateriaisSalvos: () => void
  precoReferenciaConfig: PrecoReferencia
  margemPadrao: number
  lojaPadrao?: string
}) {
  const inputCameraRef = useRef<HTMLInputElement>(null)
  const inputGaleriaRef = useRef<HTMLInputElement>(null)

  const [etapa, setEtapa] = useState<Etapa>('inicio')
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [notaFiscalId, setNotaFiscalId] = useState<string | null>(null)
  const [loja, setLoja] = useState(lojaPadrao ?? '')
  const [texto, setTexto] = useState('')
  const [itens, setItens] = useState<ItemEditavel[]>([])
  const [margem, setMargem] = useState(String(margemPadrao))
  const [enviando, setEnviando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  function reiniciar() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setEtapa('inicio')
    setArquivo(null)
    setPreviewUrl(null)
    setNotaFiscalId(null)
    setTexto('')
    setItens([])
    setErro('')
  }

  function handleArquivo(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setArquivo(file)
    setPreviewUrl(URL.createObjectURL(file))
    setEtapa('preview')
    setErro('')
  }

  async function usarFoto() {
    if (!arquivo) return
    setErro('')
    setEnviando(true)
    try {
      const id = servicoId ?? (await onNeedServicoId())
      const nota = await enviarNotaFiscal(arquivo, { servicoId: id })
      setNotaFiscalId(nota.id)
      setEtapa('texto')
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível enviar a foto da nota.')
    } finally {
      setEnviando(false)
    }
  }

  function extrair() {
    const resultado = OCRService.interpretar(texto)
    setItens(
      resultado.itens.map((i) => ({
        id: demoId(),
        nome: i.nome,
        codigo: '',
        quantidade: formatNumber(i.quantidade, 3),
        unidade: i.unidade,
        valorUnitario: formatNumber(i.valorUnitario),
        valorSugerido: '',
      })),
    )
    setEtapa('conferencia')
  }

  function atualizarItem(id: string, campo: keyof ItemEditavel, valor: string) {
    setItens((lista) => lista.map((it) => (it.id === id ? { ...it, [campo]: valor } : it)))
  }

  function removerItem(id: string) {
    setItens((lista) => lista.filter((it) => it.id !== id))
  }

  function adicionarLinha() {
    setItens((lista) => [
      ...lista,
      {
        id: demoId(),
        nome: '',
        codigo: '',
        quantidade: '1',
        unidade: 'un',
        valorUnitario: '',
        valorSugerido: '',
      },
    ])
  }

  const margemNum = num(margem)
  const totalNota = itens.reduce((s, it) => s + num(it.quantidade) * num(it.valorUnitario), 0)

  async function confirmarESalvar() {
    const validos = itens.filter((it) => it.nome.trim() && num(it.quantidade) > 0)
    if (validos.length === 0) {
      setErro('Adicione ao menos um item com nome e quantidade.')
      return
    }
    setErro('')
    setSalvando(true)
    try {
      const id = servicoId ?? (await onNeedServicoId())
      const dataCompra = nowIso().slice(0, 10)
      for (const it of validos) {
        const custoUnit = num(it.valorUnitario)
        const catalogoExistente = await buscarNoCatalogo(it.codigo || null, it.nome).catch(
          () => null,
        )
        const { catalogo } = await registrarCompra({
          nome: it.nome.trim(),
          codigo: it.codigo.trim() || null,
          unidade: it.unidade,
          lojaNome: loja.trim() || null,
          quantidade: num(it.quantidade),
          valorUnitario: custoUnit,
          dataCompra,
          notaFiscalId,
          servicoId: id,
        })
        const referencia = precoReferencia(
          catalogoExistente ?? catalogo,
          precoReferenciaConfig,
          custoUnit,
        )
        const base = referencia > 0 ? referencia : custoUnit
        const cobradoSugerido = it.valorSugerido.trim()
          ? num(it.valorSugerido)
          : aplicarMargem(base, margemNum)

        await createMaterial({
          servico_id: id,
          nome: it.nome.trim(),
          quantidade: num(it.quantidade),
          unidade: it.unidade,
          valor_custo: custoUnit,
          margem_percentual: margemNum,
          valor_cobrado: cobradoSugerido,
          codigo: it.codigo.trim() || null,
          material_catalogo_id: catalogo.id,
        })
      }
      onMateriaisSalvos()
      reiniciar()
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível salvar os materiais.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Card className="space-y-3">
      <h2 className="text-sm font-semibold text-slate-700">📷 Materiais</h2>

      {etapa === 'inicio' && (
        <>
          <p className="text-sm text-slate-500">
            Fotografe a nota ou cupom dos materiais utilizados.
          </p>
          <input
            ref={inputCameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleArquivo}
          />
          <input
            ref={inputGaleriaRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleArquivo}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => inputCameraRef.current?.click()}
              className="btn-energy justify-center py-4 text-base"
            >
              📷 Tirar foto da nota
            </button>
            <button
              type="button"
              onClick={() => inputGaleriaRef.current?.click()}
              className="btn-ghost justify-center py-4 text-base"
            >
              🖼️ Escolher da galeria
            </button>
          </div>
        </>
      )}

      {etapa === 'preview' && previewUrl && (
        <>
          <img src={previewUrl} alt="Prévia da nota" className="max-h-80 w-full rounded-lg object-contain" />
          {erro && <Alert tone="error">{erro}</Alert>}
          <div className="grid gap-2 sm:grid-cols-3">
            <Button type="button" fullWidth onClick={usarFoto} disabled={enviando}>
              {enviando ? 'Enviando…' : 'Usar esta foto'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              fullWidth
              onClick={() => (etapa === 'preview' ? inputCameraRef.current?.click() : undefined)}
              disabled={enviando}
            >
              Tirar outra
            </Button>
            <Button type="button" variant="ghost" fullWidth onClick={reiniciar} disabled={enviando}>
              Cancelar
            </Button>
          </div>
        </>
      )}

      {etapa === 'texto' && (
        <>
          <Alert tone="success">Foto salva. Agora digite ou cole o texto da nota para ler os itens.</Alert>
          <TextField
            label="Loja / fornecedor (opcional)"
            value={loja}
            onChange={(e) => setLoja(e.target.value)}
            placeholder="Ex.: Ferragem Boa Vista"
          />
          <TextAreaField
            label="Texto da nota"
            name="texto"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={8}
            placeholder={
              'Digite ou cole os itens da nota, um por linha. Ex.:\n' +
              'DISJUNTOR BIPOLAR 40A   3 UN x 45,00   135,00\n' +
              'CABO FLEXIVEL 2,5MM   50 M   3,50   175,00'
            }
          />
          {!OCRService.podeLerImagem() && (
            <p className="text-xs text-slate-400">
              A leitura automática da imagem (OCR) ainda não está ativada — digite os itens e o
              sistema organiza para você conferir.
            </p>
          )}
          {erro && <Alert tone="error">{erro}</Alert>}
          <div className="grid gap-2 sm:grid-cols-2">
            <Button type="button" variant="ghost" fullWidth onClick={reiniciar}>
              Cancelar
            </Button>
            <Button type="button" fullWidth onClick={extrair} disabled={!texto.trim()}>
              Extrair itens
            </Button>
          </div>
        </>
      )}

      {etapa === 'conferencia' && (
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">Materiais identificados ({itens.length})</h3>
            <button type="button" onClick={adicionarLinha} className="text-xs font-semibold text-brand-600 underline">
              + Adicionar material
            </button>
          </div>

          {itens.length === 0 && (
            <p className="text-sm text-slate-400">
              Nenhum item reconhecido. Use "+ Adicionar material" para incluir manualmente.
            </p>
          )}

          {itens.map((it) => (
            <div key={it.id} className="space-y-2 rounded-xl bg-slate-50 p-3">
              <TextField
                label="Produto"
                value={it.nome}
                onChange={(e) => atualizarItem(it.id, 'nome', e.target.value)}
              />
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <TextField
                  label="Código"
                  value={it.codigo}
                  onChange={(e) => atualizarItem(it.id, 'codigo', e.target.value)}
                />
                <TextField
                  label="Qtd."
                  type="number"
                  inputMode="decimal"
                  value={it.quantidade}
                  onChange={(e) => atualizarItem(it.id, 'quantidade', e.target.value)}
                />
                <SelectField
                  label="Un."
                  value={it.unidade}
                  onChange={(e) => atualizarItem(it.id, 'unidade', e.target.value)}
                >
                  {UNIDADE_ORDEM.map((u) => (
                    <option key={u} value={u}>
                      {UNIDADE_LABEL[u]}
                    </option>
                  ))}
                </SelectField>
                <TextField
                  label="Valor unit."
                  type="number"
                  inputMode="decimal"
                  value={it.valorUnitario}
                  onChange={(e) => atualizarItem(it.id, 'valorUnitario', e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-slate-400">
                  Total do item: {formatCurrency(num(it.quantidade) * num(it.valorUnitario))}
                </p>
                <button
                  type="button"
                  onClick={() => removerItem(it.id)}
                  className="rounded-lg bg-white px-2 py-1 text-xs font-semibold text-red-600 ring-1 ring-slate-200"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}

          <div>
            <p className="mb-1 text-xs font-medium text-slate-500">Margem sugerida para os itens</p>
            <div className="flex flex-wrap gap-2">
              {MARGENS_PRESET.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setMargem(String(p))}
                  className={`rounded-full px-3 py-1 text-sm font-semibold ${
                    margemNum === p ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'
                  }`}
                >
                  {p}%
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between border-t border-slate-100 pt-2 text-sm font-bold text-ink-900">
            <span>Total da nota</span>
            <span>{formatCurrency(totalNota)}</span>
          </div>

          {erro && <Alert tone="error">{erro}</Alert>}

          <div className="grid gap-2 sm:grid-cols-2">
            <Button type="button" variant="ghost" fullWidth onClick={reiniciar} disabled={salvando}>
              Cancelar
            </Button>
            <Button type="button" fullWidth onClick={confirmarESalvar} disabled={salvando || itens.length === 0}>
              {salvando ? 'Salvando…' : 'Confirmar e salvar materiais'}
            </Button>
          </div>
        </>
      )}
    </Card>
  )
}
