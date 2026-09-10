import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Loading } from '@/components/ui/Loading'
import { NotasFiscais } from '@/components/servico/NotasFiscais'
import { FotosServico } from '@/components/servico/FotosServico'
import { useAsync } from '@/hooks/useAsync'
import { deleteServico, getServico, updateServico } from '@/services/servicosService'
import { criarOrcamentoDoServico } from '@/services/orcamentosService'
import { gerarPdfOrdemServico, gerarPdfRelatorioTecnico } from '@/services/documentacaoService'
import { baixarBlob, compartilharArquivo } from '@/utils/download'
import { AIService } from '@/services/aiService'
import { getCliente } from '@/services/clientesService'
import { deleteMaterial, listMateriais, updateMaterial } from '@/services/materiaisService'
import { SERVICO_STATUS_META, TIPO_HORA_META } from '@/config/servico'
import { MARGENS_PRESET } from '@/config/material'
import { aplicarMargem } from '@/utils/margem'
import { formatCurrency, formatDate } from '@/utils/format'
import type { ClienteRow, MaterialRow, ServicoRow } from '@/types/database'

interface Detalhe {
  servico: ServicoRow | null
  cliente: ClienteRow | null
  materiais: MaterialRow[]
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <span className="text-slate-500">{rotulo}</span>
      <span className="text-right font-medium text-ink-900">{valor}</span>
    </div>
  )
}

export default function ServicoDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [excluindo, setExcluindo] = useState(false)
  const [erroExcluir, setErroExcluir] = useState('')
  const [aplicandoMargem, setAplicandoMargem] = useState(false)
  const [gerando, setGerando] = useState(false)
  const [descricaoGerada, setDescricaoGerada] = useState<string | null>(null)
  const [gerandoOrcamento, setGerandoOrcamento] = useState(false)
  const [pdfServico, setPdfServico] = useState<'os' | 'relatorio' | null>(null)

  const { data, loading, error, reload } = useAsync<Detalhe>(async () => {
    const servico = await getServico(id)
    if (!servico) return { servico: null, cliente: null, materiais: [] }
    const [cliente, materiais] = await Promise.all([
      servico.cliente_id ? getCliente(servico.cliente_id) : Promise.resolve(null),
      listMateriais({ servicoId: id }),
    ])
    return { servico, cliente, materiais }
  }, [id])

  async function handleExcluirMaterial(materialId: string) {
    if (!window.confirm('Remover este material do serviço?')) return
    setErroExcluir('')
    try {
      await deleteMaterial(materialId)
      reload()
    } catch (err) {
      setErroExcluir(err instanceof Error ? err.message : 'Não foi possível remover o material.')
    }
  }

  async function handleAplicarMargemTodos(margem: number) {
    const itens = data?.materiais ?? []
    if (itens.length === 0) return
    if (!window.confirm(`Aplicar margem de ${margem}% a ${itens.length} material(is)?`)) return
    setAplicandoMargem(true)
    setErroExcluir('')
    try {
      for (const m of itens) {
        await updateMaterial(m.id, {
          margem_percentual: margem,
          valor_cobrado: aplicarMargem(m.valor_custo, margem),
        })
      }
      reload()
    } catch (err) {
      setErroExcluir(err instanceof Error ? err.message : 'Não foi possível aplicar a margem.')
    } finally {
      setAplicandoMargem(false)
    }
  }

  async function gerarDescricao() {
    if (!data?.servico) return
    setGerando(true)
    setErroExcluir('')
    try {
      const s = data.servico
      const texto = await AIService.gerarDescricaoServico({
        textoLivre: s.descricao_livre || s.descricao || '',
        materiais: (data.materiais ?? []).map((m) => ({
          nome: m.nome,
          quantidade: m.quantidade,
          unidade: m.unidade,
        })),
        quantidadeTecnicos: s.quantidade_tecnicos,
        horasTrabalhadas: s.horas_trabalhadas,
        clienteNome: data.cliente?.nome ?? null,
      })
      setDescricaoGerada(texto || 'Sem conteúdo para gerar. Preencha as anotações do serviço.')
    } catch (err) {
      setErroExcluir(err instanceof Error ? err.message : 'Não foi possível gerar a descrição.')
    } finally {
      setGerando(false)
    }
  }

  async function aplicarDescricao() {
    if (descricaoGerada === null) return
    try {
      await updateServico(id, { descricao: descricaoGerada })
      setDescricaoGerada(null)
      reload()
    } catch (err) {
      setErroExcluir(err instanceof Error ? err.message : 'Não foi possível salvar a descrição.')
    }
  }

  async function gerarPdf(tipo: 'os' | 'relatorio') {
    setPdfServico(tipo)
    setErroExcluir('')
    try {
      const { blob, nomeArquivo } =
        tipo === 'os'
          ? await gerarPdfOrdemServico(id)
          : await gerarPdfRelatorioTecnico(id)
      const compartilhou = await compartilharArquivo(blob, nomeArquivo, nomeArquivo)
      if (!compartilhou) baixarBlob(blob, nomeArquivo)
    } catch (err) {
      setErroExcluir(err instanceof Error ? err.message : 'Não foi possível gerar o PDF.')
    } finally {
      setPdfServico(null)
    }
  }

  async function gerarOrcamento() {
    setGerandoOrcamento(true)
    setErroExcluir('')
    try {
      const orcamento = await criarOrcamentoDoServico(id)
      navigate(`/orcamentos/${orcamento.id}`)
    } catch (err) {
      setErroExcluir(err instanceof Error ? err.message : 'Não foi possível gerar o orçamento.')
      setGerandoOrcamento(false)
    }
  }

  async function handleExcluir() {
    if (!window.confirm('Excluir este serviço? Esta ação não pode ser desfeita.')) return
    setExcluindo(true)
    setErroExcluir('')
    try {
      await deleteServico(id)
      navigate('/servicos', { replace: true })
    } catch (err) {
      setErroExcluir(err instanceof Error ? err.message : 'Não foi possível excluir.')
      setExcluindo(false)
    }
  }

  if (loading) return <Loading label="Carregando serviço…" />

  if (error) {
    return (
      <div className="space-y-4">
        <PageHeader title="Serviço" />
        <Alert tone="error">
          {error}{' '}
          <button type="button" onClick={reload} className="font-semibold underline">
            Tentar novamente
          </button>
        </Alert>
        <Button variant="ghost" onClick={() => navigate('/servicos')}>
          Voltar
        </Button>
      </div>
    )
  }

  if (!data?.servico) {
    return (
      <div className="space-y-4">
        <PageHeader title="Serviço" />
        <Alert tone="error">Serviço não encontrado.</Alert>
        <Button variant="ghost" onClick={() => navigate('/servicos')}>
          Voltar para serviços
        </Button>
      </div>
    )
  }

  const { servico, cliente, materiais } = data
  const meta = SERVICO_STATUS_META[servico.status]
  const totalMateriais = materiais.reduce((s, m) => s + m.valor_cobrado * m.quantidade, 0)
  const total =
    servico.valor_mao_de_obra + servico.taxa_deslocamento + servico.outros_custos + totalMateriais

  return (
    <div className="space-y-4">
      <PageHeader
        title={cliente?.nome ?? 'Serviço sem cliente'}
        subtitle={formatDate(servico.data_servico ?? servico.created_at)}
        action={
          <Link to={`/servicos/${servico.id}/editar`} className="btn-ghost">
            Editar
          </Link>
        }
      />

      {erroExcluir && <Alert tone="error">{erroExcluir}</Alert>}

      <Card className="space-y-2">
        <div className="flex items-center justify-between">
          <Badge tone={meta.tone}>{meta.label}</Badge>
          {cliente && (
            <Link to={`/clientes/${cliente.id}`} className="text-xs font-semibold text-brand-600 underline">
              Ver cliente
            </Link>
          )}
        </div>
        <p className="whitespace-pre-wrap text-sm text-slate-700">{servico.descricao}</p>
        {servico.descricao_livre && (
          <p className="whitespace-pre-wrap border-t border-slate-100 pt-2 text-xs text-slate-400">
            Anotações: {servico.descricao_livre}
          </p>
        )}

        <button
          type="button"
          onClick={gerarDescricao}
          disabled={gerando}
          className="border-t border-slate-100 pt-2 text-left text-xs font-semibold text-brand-600 underline disabled:opacity-50"
        >
          {gerando ? 'Gerando…' : '✨ Gerar descrição profissional'}
        </button>

        {descricaoGerada !== null && (
          <div className="rounded-xl bg-brand-50 p-3">
            <p className="whitespace-pre-wrap text-sm text-ink-900">{descricaoGerada}</p>
            <div className="mt-2 flex gap-3 text-xs font-semibold">
              <button type="button" onClick={aplicarDescricao} className="text-brand-700 underline">
                Aplicar como descrição
              </button>
              <button
                type="button"
                onClick={() => setDescricaoGerada(null)}
                className="text-slate-500 underline"
              >
                Descartar
              </button>
            </div>
          </div>
        )}
      </Card>

      <Card>
        <h2 className="mb-1 text-sm font-semibold text-slate-700">Mão de obra</h2>
        <Linha rotulo="Técnicos" valor={String(servico.quantidade_tecnicos)} />
        <Linha rotulo="Horas trabalhadas" valor={`${servico.horas_trabalhadas} h`} />
        <Linha rotulo="Tipo de hora" valor={TIPO_HORA_META[servico.tipo_hora].label} />
        <Linha rotulo="Valor da hora" valor={formatCurrency(servico.valor_hora_aplicado)} />
        <Linha rotulo="Total mão de obra" valor={formatCurrency(servico.valor_mao_de_obra)} />
        <p className="mt-1 text-xs text-slate-400">
          {servico.quantidade_tecnicos} × {servico.horas_trabalhadas}h ×{' '}
          {formatCurrency(servico.valor_hora_aplicado)} ={' '}
          {formatCurrency(servico.valor_mao_de_obra)}
        </p>
      </Card>

      <Card>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">
            Materiais ({materiais.length})
          </h2>
          <Link
            to={`/servicos/${servico.id}/materiais/novo`}
            className="text-xs font-semibold text-brand-600 underline"
          >
            + Adicionar
          </Link>
        </div>
        {materiais.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhum material adicionado a este serviço.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {materiais.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate text-ink-900">{m.nome}</p>
                  <p className="text-xs text-slate-400">
                    {m.quantidade} {m.unidade} × {formatCurrency(m.valor_cobrado)} · margem{' '}
                    {m.margem_percentual}%
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="font-medium">
                    {formatCurrency(m.valor_cobrado * m.quantidade)}
                  </span>
                  <Link
                    to={`/servicos/${servico.id}/materiais/${m.id}/editar`}
                    className="text-xs font-semibold text-brand-600 underline"
                  >
                    Editar
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleExcluirMaterial(m.id)}
                    className="text-xs font-semibold text-red-600 underline"
                  >
                    Excluir
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {materiais.length > 0 && (
          <>
            <div className="mt-3 border-t border-slate-100 pt-3">
              <p className="mb-1 text-xs font-medium text-slate-500">
                Aplicar margem a todos os materiais
              </p>
              <div className="flex flex-wrap gap-2">
                {MARGENS_PRESET.map((p) => (
                  <button
                    key={p}
                    type="button"
                    disabled={aplicandoMargem}
                    onClick={() => handleAplicarMargemTodos(p)}
                    className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 disabled:opacity-50"
                  >
                    {p}%
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-3 flex justify-between border-t border-slate-100 pt-2 text-sm font-semibold">
              <span className="text-slate-500">Total materiais</span>
              <span>{formatCurrency(totalMateriais)}</span>
            </div>
          </>
        )}
      </Card>

      <NotasFiscais servicoId={servico.id} />

      <FotosServico servicoId={servico.id} />

      <Card>
        <Linha rotulo="Mão de obra" valor={formatCurrency(servico.valor_mao_de_obra)} />
        {servico.taxa_deslocamento > 0 && (
          <Linha rotulo="Deslocamento" valor={formatCurrency(servico.taxa_deslocamento)} />
        )}
        {servico.outros_custos > 0 && (
          <Linha rotulo="Outros custos" valor={formatCurrency(servico.outros_custos)} />
        )}
        {totalMateriais > 0 && (
          <Linha rotulo="Materiais" valor={formatCurrency(totalMateriais)} />
        )}
        <div className="mt-1 flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-ink-900">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </Card>

      <Button variant="energy" fullWidth onClick={gerarOrcamento} disabled={gerandoOrcamento}>
        {gerandoOrcamento ? 'Gerando orçamento…' : 'Gerar orçamento deste serviço'}
      </Button>

      <Card className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-700">Documentos (PDF)</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button type="button" variant="ghost" fullWidth onClick={() => gerarPdf('os')} disabled={pdfServico !== null}>
            {pdfServico === 'os' ? 'Gerando…' : 'Ordem de serviço'}
          </Button>
          <Button type="button" variant="ghost" fullWidth onClick={() => gerarPdf('relatorio')} disabled={pdfServico !== null}>
            {pdfServico === 'relatorio' ? 'Gerando…' : 'Relatório técnico'}
          </Button>
        </div>
      </Card>

      <Button
        variant="ghost"
        fullWidth
        onClick={handleExcluir}
        disabled={excluindo}
        className="text-red-600 hover:bg-red-50"
      >
        {excluindo ? 'Excluindo…' : 'Excluir serviço'}
      </Button>
    </div>
  )
}
