import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Loading } from '@/components/ui/Loading'
import { TextField } from '@/components/ui/TextField'
import { TextAreaField } from '@/components/ui/TextAreaField'
import { SelectField } from '@/components/ui/SelectField'
import { useAsync } from '@/hooks/useAsync'
import {
  atualizarTextoOcr,
  getNotaFiscal,
  getUrlNotaFiscal,
} from '@/services/notasFiscaisService'
import { getConfiguracao } from '@/services/configuracoesService'
import { createMaterial } from '@/services/materiaisService'
import { OCRService } from '@/services/ocrService'
import { MARGEM_PADRAO, MARGENS_PRESET, UNIDADE_LABEL, UNIDADE_ORDEM } from '@/config/material'
import { aplicarMargem } from '@/utils/margem'
import { formatCurrency, formatNumber } from '@/utils/format'
import type { MaterialUnidade } from '@/types/database'
import { demoId } from '@/services/demoStore'

interface ItemEditavel {
  id: string
  nome: string
  quantidade: string
  unidade: MaterialUnidade
  valorUnitario: string
}

function num(v: string): number {
  const n = Number.parseFloat(v.replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

export default function LeituraNotaPage() {
  const { id: servicoId = '', notaId = '' } = useParams<{ id: string; notaId: string }>()
  const navigate = useNavigate()
  const voltar = `/servicos/${servicoId}`

  const { data, loading, error } = useAsync(async () => {
    const [nota, config] = await Promise.all([getNotaFiscal(notaId), getConfiguracao()])
    const url = nota ? await getUrlNotaFiscal(nota.arquivo_path).catch(() => null) : null
    return { nota, config, url }
  }, [notaId])

  const [texto, setTexto] = useState<string | null>(null)
  const [itens, setItens] = useState<ItemEditavel[]>([])
  const [extraiu, setExtraiu] = useState(false)
  const [margem, setMargem] = useState(String(MARGEM_PADRAO))
  const [salvando, setSalvando] = useState(false)
  const [erroSalvar, setErroSalvar] = useState('')

  const textoAtual = texto ?? data?.nota?.texto_ocr ?? ''
  const margemNum = num(margem)

  const totais = useMemo(() => {
    let custo = 0
    let cobrado = 0
    for (const it of itens) {
      const q = num(it.quantidade)
      const vu = num(it.valorUnitario)
      custo += q * vu
      cobrado += q * aplicarMargem(vu, margemNum)
    }
    return { custo, cobrado }
  }, [itens, margemNum])

  function extrair() {
    const resultado = OCRService.interpretar(textoAtual)
    setItens(
      resultado.itens.map((i) => ({
        id: demoId(),
        nome: i.nome,
        quantidade: formatNumber(i.quantidade, 3),
        unidade: i.unidade,
        valorUnitario: formatNumber(i.valorUnitario),
      })),
    )
    setExtraiu(true)
    void atualizarTextoOcr(notaId, textoAtual).catch(() => undefined)
  }

  function atualizarItem(id: string, campo: keyof ItemEditavel, valor: string) {
    setItens((lista) =>
      lista.map((it) => (it.id === id ? ({ ...it, [campo]: valor } as ItemEditavel) : it)),
    )
  }

  function removerItem(id: string) {
    setItens((lista) => lista.filter((it) => it.id !== id))
  }

  function adicionarLinha() {
    setItens((lista) => [
      ...lista,
      { id: demoId(), nome: '', quantidade: '1', unidade: 'un', valorUnitario: '' },
    ])
  }

  async function adicionarAoServico() {
    const validos = itens.filter((it) => it.nome.trim() && num(it.quantidade) > 0)
    if (validos.length === 0) {
      setErroSalvar('Adicione ao menos um item com nome e quantidade.')
      return
    }
    setErroSalvar('')
    setSalvando(true)
    try {
      for (const it of validos) {
        const custo = num(it.valorUnitario)
        await createMaterial({
          servico_id: servicoId,
          nome: it.nome.trim(),
          quantidade: num(it.quantidade),
          unidade: it.unidade,
          valor_custo: custo,
          margem_percentual: margemNum,
          valor_cobrado: aplicarMargem(custo, margemNum),
        })
      }
      navigate(voltar, { replace: true })
    } catch (err) {
      setErroSalvar(err instanceof Error ? err.message : 'Não foi possível adicionar os materiais.')
    } finally {
      setSalvando(false)
    }
  }

  if (loading) return <Loading label="Carregando nota…" />

  if (error || !data?.nota) {
    return (
      <div className="space-y-4">
        <PageHeader title="Ler nota fiscal" />
        <Alert tone="error">{error ?? 'Nota fiscal não encontrada.'}</Alert>
        <Button variant="ghost" onClick={() => navigate(voltar)}>
          Voltar para o serviço
        </Button>
      </div>
    )
  }

  const { nota, url } = data
  const isImagem = (nota.tipo_arquivo ?? '').startsWith('image/')

  return (
    <div className="space-y-4">
      <PageHeader
        title="Ler nota fiscal"
        subtitle={nota.nome_arquivo}
      />

      {isImagem && url && (
        <Card>
          <img src={url} alt={nota.nome_arquivo} className="max-h-72 w-full rounded-lg object-contain" />
        </Card>
      )}

      <Card className="space-y-3">
        <TextAreaField
          label="Texto da nota"
          name="texto"
          value={textoAtual}
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
            A leitura automática por imagem (OCR) não está ativada. Informe o texto e o
            sistema extrai os itens — você sempre pode ajustar.
          </p>
        )}
        <Button type="button" variant="ghost" onClick={extrair} disabled={!textoAtual.trim()}>
          Extrair itens
        </Button>
      </Card>

      {extraiu && (
        <>
          <Card className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700">
                Itens ({itens.length})
              </h2>
              <button
                type="button"
                onClick={adicionarLinha}
                className="text-xs font-semibold text-brand-600 underline"
              >
                + Adicionar item
              </button>
            </div>

            {itens.length === 0 && (
              <p className="text-sm text-slate-400">
                Nenhum item reconhecido. Use "+ Adicionar item" para incluir manualmente.
              </p>
            )}

            {itens.map((it) => (
              <div key={it.id} className="space-y-2 rounded-xl bg-slate-50 p-3">
                <TextField
                  label="Nome"
                  value={it.nome}
                  onChange={(e) => atualizarItem(it.id, 'nome', e.target.value)}
                />
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
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
                    label="Custo unit."
                    type="number"
                    inputMode="decimal"
                    value={it.valorUnitario}
                    onChange={(e) => atualizarItem(it.id, 'valorUnitario', e.target.value)}
                  />
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => removerItem(it.id)}
                      className="w-full rounded-lg bg-white px-2 py-2.5 text-xs font-semibold text-red-600 ring-1 ring-slate-200"
                    >
                      Remover
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-400">
                  Cobrado: {formatCurrency(aplicarMargem(num(it.valorUnitario), margemNum))} / un ·
                  subtotal{' '}
                  {formatCurrency(aplicarMargem(num(it.valorUnitario), margemNum) * num(it.quantidade))}
                </p>
              </div>
            ))}
          </Card>

          <Card className="space-y-3">
            <div>
              <p className="mb-1 text-sm font-medium text-slate-700">Margem para todos os itens</p>
              <div className="flex flex-wrap gap-2">
                {MARGENS_PRESET.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setMargem(String(p))}
                    className={`rounded-full px-3 py-1 text-sm font-semibold ${
                      margemNum === p
                        ? 'bg-brand-600 text-white'
                        : 'bg-white text-slate-600 ring-1 ring-slate-200'
                    }`}
                  >
                    {p}%
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Custo total</span>
              <span className="font-medium">{formatCurrency(totais.custo)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Cobrado total (com margem)</span>
              <span className="font-bold text-ink-900">{formatCurrency(totais.cobrado)}</span>
            </div>
          </Card>

          {erroSalvar && <Alert tone="error">{erroSalvar}</Alert>}

          <div className="grid gap-3 sm:grid-cols-2">
            <Button variant="ghost" fullWidth onClick={() => navigate(voltar)} disabled={salvando}>
              Cancelar
            </Button>
            <Button fullWidth onClick={adicionarAoServico} disabled={salvando || itens.length === 0}>
              {salvando ? 'Adicionando…' : `Adicionar ao serviço`}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
