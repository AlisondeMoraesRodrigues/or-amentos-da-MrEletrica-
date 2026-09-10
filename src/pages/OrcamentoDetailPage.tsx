import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Loading } from '@/components/ui/Loading'
import { SelectField } from '@/components/ui/SelectField'
import { useAsync } from '@/hooks/useAsync'
import { deleteOrcamento, getOrcamento, updateOrcamento } from '@/services/orcamentosService'
import { getCliente } from '@/services/clientesService'
import { gerarPdfOrcamento } from '@/services/documentacaoService'
import { getConfiguracao } from '@/services/configuracoesService'
import { gerarPixCopiaECola, gerarPixQrDataUrl, pixConfigurado } from '@/services/pixService'
import { baixarBlob, compartilharArquivo, linkWhatsApp } from '@/utils/download'
import { ORCAMENTO_STATUS_META, ORCAMENTO_STATUS_ORDEM } from '@/config/orcamento'
import { totalMateriaisCobrado } from '@/utils/orcamento'
import { formatCurrency, formatDate } from '@/utils/format'
import type { ClienteRow, OrcamentoRow, OrcamentoStatus } from '@/types/database'

interface Detalhe {
  orcamento: OrcamentoRow | null
  cliente: ClienteRow | null
  pix: { copiaECola: string; qrDataUrl: string | null } | null
}

function Linha({ rotulo, valor, forte }: { rotulo: string; valor: string; forte?: boolean }) {
  return (
    <div
      className={`flex justify-between gap-4 py-1.5 text-sm ${
        forte ? 'border-t border-slate-200 pt-2 text-base font-bold text-ink-900' : ''
      }`}
    >
      <span className={forte ? '' : 'text-slate-500'}>{rotulo}</span>
      <span className={forte ? '' : 'font-medium text-ink-900'}>{valor}</span>
    </div>
  )
}

export default function OrcamentoDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [erroAcao, setErroAcao] = useState('')
  const [mudandoStatus, setMudandoStatus] = useState(false)
  const [excluindo, setExcluindo] = useState(false)
  const [pdfAcao, setPdfAcao] = useState<'baixar' | 'compartilhar' | null>(null)

  const { data, loading, error, reload } = useAsync<Detalhe>(async () => {
    const orcamento = await getOrcamento(id)
    if (!orcamento) return { orcamento: null, cliente: null, pix: null }
    const [cliente, config] = await Promise.all([
      orcamento.cliente_id ? getCliente(orcamento.cliente_id) : Promise.resolve(null),
      getConfiguracao(),
    ])
    let pix: Detalhe['pix'] = null
    if (pixConfigurado(config)) {
      const copiaECola = gerarPixCopiaECola({
        chave: config.pix_chave ?? '',
        beneficiario: config.pix_beneficiario ?? '',
        cidade: config.pix_cidade ?? '',
        valor: orcamento.valor_total,
        descricao: orcamento.numero,
      })
      pix = { copiaECola, qrDataUrl: await gerarPixQrDataUrl(copiaECola) }
    }
    return { orcamento, cliente, pix }
  }, [id])

  const [copiado, setCopiado] = useState(false)
  async function copiarPix() {
    if (!data?.pix) return
    try {
      await navigator.clipboard.writeText(data.pix.copiaECola)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      setErroAcao('Não foi possível copiar. Selecione o texto manualmente.')
    }
  }

  async function mudarStatus(status: OrcamentoStatus) {
    setMudandoStatus(true)
    setErroAcao('')
    try {
      await updateOrcamento(id, { status })
      reload()
    } catch (err) {
      setErroAcao(err instanceof Error ? err.message : 'Não foi possível mudar o status.')
    } finally {
      setMudandoStatus(false)
    }
  }

  async function handlePdf(acao: 'baixar' | 'compartilhar') {
    setPdfAcao(acao)
    setErroAcao('')
    try {
      const { blob, nomeArquivo } = await gerarPdfOrcamento(id)
      if (acao === 'compartilhar') {
        const ok = await compartilharArquivo(blob, nomeArquivo, `Orçamento ${data?.orcamento?.numero ?? ''}`)
        if (!ok) baixarBlob(blob, nomeArquivo)
      } else {
        baixarBlob(blob, nomeArquivo)
      }
      reload()
    } catch (err) {
      setErroAcao(err instanceof Error ? err.message : 'Não foi possível gerar o PDF.')
    } finally {
      setPdfAcao(null)
    }
  }

  async function handleExcluir() {
    if (!window.confirm('Excluir este orçamento?')) return
    setExcluindo(true)
    setErroAcao('')
    try {
      await deleteOrcamento(id)
      navigate('/orcamentos', { replace: true })
    } catch (err) {
      setErroAcao(err instanceof Error ? err.message : 'Não foi possível excluir.')
      setExcluindo(false)
    }
  }

  if (loading) return <Loading label="Carregando orçamento…" />

  if (error || !data?.orcamento) {
    return (
      <div className="space-y-4">
        <PageHeader title="Orçamento" />
        <Alert tone="error">{error ?? 'Orçamento não encontrado.'}</Alert>
        <Button variant="ghost" onClick={() => navigate('/orcamentos')}>
          Voltar para orçamentos
        </Button>
      </div>
    )
  }

  const { orcamento: o, cliente } = data
  const meta = ORCAMENTO_STATUS_META[o.status]

  return (
    <div className="space-y-4">
      <PageHeader
        title={o.numero}
        subtitle={cliente?.nome ?? 'Sem cliente'}
        action={
          <Link to={`/orcamentos/${o.id}/editar`} className="btn-ghost">
            Editar
          </Link>
        }
      />

      {erroAcao && <Alert tone="error">{erroAcao}</Alert>}

      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <Badge tone={meta.tone}>{meta.label}</Badge>
          {cliente && (
            <Link to={`/clientes/${cliente.id}`} className="text-xs font-semibold text-brand-600 underline">
              Ver cliente
            </Link>
          )}
        </div>
        <SelectField
          label="Alterar status"
          name="status"
          value={o.status}
          disabled={mudandoStatus}
          onChange={(e) => mudarStatus(e.target.value as OrcamentoStatus)}
        >
          {ORCAMENTO_STATUS_ORDEM.map((s) => (
            <option key={s} value={s}>
              {ORCAMENTO_STATUS_META[s].label}
            </option>
          ))}
        </SelectField>
      </Card>

      <Card>
        <h2 className="mb-1 text-sm font-semibold text-slate-700">Composição do valor</h2>
        <Linha rotulo="Materiais (custo)" valor={formatCurrency(o.valor_materiais)} />
        <Linha rotulo="Margem de materiais" valor={formatCurrency(o.valor_margem_materiais)} />
        <Linha
          rotulo="Materiais (cobrado)"
          valor={formatCurrency(totalMateriaisCobrado({
            valorMateriais: o.valor_materiais,
            valorMargemMateriais: o.valor_margem_materiais,
          }))}
        />
        {o.mo_qtd_tecnicos > 0 || o.mo_qtd_ajudantes > 0 ? (
          <>
            <Linha
              rotulo={`Mão de obra — técnicos (${o.mo_qtd_tecnicos}×${o.mo_horas_tecnicos}h)`}
              valor={formatCurrency(o.mo_qtd_tecnicos * o.mo_horas_tecnicos * o.mo_valor_hora_tecnico)}
            />
            {o.mo_qtd_ajudantes > 0 && (
              <Linha
                rotulo={`Mão de obra — ajudantes (${o.mo_qtd_ajudantes}×${o.mo_horas_ajudantes}h)`}
                valor={formatCurrency(
                  o.mo_qtd_ajudantes * o.mo_horas_ajudantes * o.mo_valor_hora_ajudante,
                )}
              />
            )}
          </>
        ) : (
          <Linha rotulo="Mão de obra" valor={formatCurrency(o.valor_mao_de_obra)} />
        )}
        <Linha rotulo="Deslocamento" valor={formatCurrency(o.valor_deslocamento)} />
        <Linha rotulo="Outros custos" valor={formatCurrency(o.outros_custos)} />
        <Linha rotulo="VALOR TOTAL" valor={formatCurrency(o.valor_total)} forte />
      </Card>

      <Card>
        <Linha rotulo="Número" valor={o.numero} />
        <Linha rotulo="Criado em" valor={formatDate(o.created_at)} />
        {o.validade_data && <Linha rotulo="Validade" valor={formatDate(o.validade_data)} />}
        {o.forma_pagamento && <Linha rotulo="Pagamento" valor={o.forma_pagamento} />}
        {o.servico_id && (
          <div className="pt-1">
            <Link
              to={`/servicos/${o.servico_id}`}
              className="text-xs font-semibold text-brand-600 underline"
            >
              Ver serviço vinculado
            </Link>
          </div>
        )}
      </Card>

      {o.garantia && (
        <Card>
          <h2 className="mb-1 text-sm font-semibold text-slate-700">Garantia</h2>
          <p className="whitespace-pre-wrap text-sm text-slate-600">{o.garantia}</p>
        </Card>
      )}

      {o.observacoes && (
        <Card>
          <h2 className="mb-1 text-sm font-semibold text-slate-700">Observações</h2>
          <p className="whitespace-pre-wrap text-sm text-slate-600">{o.observacoes}</p>
        </Card>
      )}

      {data.pix && (
        <Card className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-700">Pagamento via PIX</h2>
          {data.pix.qrDataUrl && (
            <img
              src={data.pix.qrDataUrl}
              alt="QR Code PIX"
              className="mx-auto h-44 w-44"
            />
          )}
          <p className="break-all rounded-lg bg-slate-50 p-2 font-mono text-[11px] text-slate-600">
            {data.pix.copiaECola}
          </p>
          <Button type="button" variant="ghost" fullWidth onClick={copiarPix}>
            {copiado ? 'Copiado!' : 'Copiar código PIX'}
          </Button>
        </Card>
      )}

      <Card className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-700">Documento</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            type="button"
            variant="energy"
            fullWidth
            onClick={() => handlePdf('baixar')}
            disabled={pdfAcao !== null}
          >
            {pdfAcao === 'baixar' ? 'Gerando…' : 'Baixar PDF'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            fullWidth
            onClick={() => handlePdf('compartilhar')}
            disabled={pdfAcao !== null}
          >
            {pdfAcao === 'compartilhar' ? 'Gerando…' : 'Compartilhar'}
          </Button>
        </div>
        {data.cliente?.whatsapp && (
          <a
            href={linkWhatsApp(
              `Olá! Segue o orçamento ${o.numero} — total ${formatCurrency(o.valor_total)}.`,
              data.cliente.whatsapp,
            )}
            target="_blank"
            rel="noreferrer"
            className="block text-center text-xs font-semibold text-green-700 underline"
          >
            Abrir conversa no WhatsApp
          </a>
        )}
        {o.status === 'aprovado' && (
          <Link
            to="/recibos/novo"
            state={{
              clienteNome: cliente?.nome ?? '',
              clienteId: o.cliente_id,
              valor: o.valor_total,
              referencia: `serviços — ${o.numero}`,
              formaPagamento: o.forma_pagamento,
              orcamentoId: o.id,
              servicoId: o.servico_id,
            }}
            className="block text-center text-xs font-semibold text-brand-600 underline"
          >
            Gerar recibo deste orçamento
          </Link>
        )}
      </Card>

      <Button
        variant="ghost"
        fullWidth
        onClick={handleExcluir}
        disabled={excluindo}
        className="text-red-600 hover:bg-red-50"
      >
        {excluindo ? 'Excluindo…' : 'Excluir orçamento'}
      </Button>
    </div>
  )
}
