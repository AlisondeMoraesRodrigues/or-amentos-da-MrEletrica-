import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Loading } from '@/components/ui/Loading'
import { useAsync } from '@/hooks/useAsync'
import { deleteCliente, getCliente } from '@/services/clientesService'
import { listServicos } from '@/services/servicosService'
import { listOrcamentos } from '@/services/orcamentosService'
import { listMateriais } from '@/services/materiaisService'
import { listDocumentos } from '@/services/documentosService'
import { SERVICO_STATUS_META } from '@/config/servico'
import { ORCAMENTO_STATUS_META } from '@/config/orcamento'
import { formatCurrency, formatDate } from '@/utils/format'
import type { ClienteRow, DocumentoRow, OrcamentoRow, ServicoRow } from '@/types/database'

interface DetalheCliente {
  cliente: ClienteRow | null
  servicos: ServicoRow[]
  orcamentos: OrcamentoRow[]
  documentos: DocumentoRow[]
  totalMateriais: number
  totalServicos: number
  totalFaturado: number
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string | null }) {
  if (!valor) return null
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <span className="text-slate-500">{rotulo}</span>
      <span className="text-right font-medium text-ink-900">{valor}</span>
    </div>
  )
}

export default function ClienteDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [excluindo, setExcluindo] = useState(false)
  const [erroExcluir, setErroExcluir] = useState('')

  const { data, loading, error, reload } = useAsync<DetalheCliente>(async () => {
    const cliente = await getCliente(id)
    if (!cliente) {
      return {
        cliente: null,
        servicos: [],
        orcamentos: [],
        documentos: [],
        totalMateriais: 0,
        totalServicos: 0,
        totalFaturado: 0,
      }
    }
    const [servicos, orcamentos, documentos] = await Promise.all([
      listServicos({ clienteId: id }),
      listOrcamentos({ clienteId: id }),
      listDocumentos({ clienteId: id }),
    ])
    const materiaisPorServico = await Promise.all(
      servicos.map((s) => listMateriais({ servicoId: s.id })),
    )
    const totalMateriais = materiaisPorServico
      .flat()
      .reduce((t, m) => t + m.valor_cobrado * m.quantidade, 0)
    return {
      cliente,
      servicos,
      orcamentos,
      documentos,
      totalMateriais: Math.round(totalMateriais * 100) / 100,
      totalServicos: servicos.reduce((t, s) => t + s.valor_mao_de_obra, 0),
      totalFaturado: orcamentos
        .filter((o) => o.status === 'aprovado')
        .reduce((t, o) => t + o.valor_total, 0),
    }
  }, [id])

  async function handleExcluir() {
    if (!window.confirm('Excluir este cliente? Esta ação não pode ser desfeita.')) return
    setExcluindo(true)
    setErroExcluir('')
    try {
      await deleteCliente(id)
      navigate('/clientes', { replace: true })
    } catch (err) {
      setErroExcluir(err instanceof Error ? err.message : 'Não foi possível excluir.')
      setExcluindo(false)
    }
  }

  if (loading) return <Loading label="Carregando cliente…" />

  if (error) {
    return (
      <div className="space-y-4">
        <PageHeader title="Cliente" />
        <Alert tone="error">
          {error}{' '}
          <button type="button" onClick={reload} className="font-semibold underline">
            Tentar novamente
          </button>
        </Alert>
        <Button variant="ghost" onClick={() => navigate('/clientes')}>
          Voltar
        </Button>
      </div>
    )
  }

  if (!data?.cliente) {
    return (
      <div className="space-y-4">
        <PageHeader title="Cliente" />
        <Alert tone="error">Cliente não encontrado.</Alert>
        <Button variant="ghost" onClick={() => navigate('/clientes')}>
          Voltar para clientes
        </Button>
      </div>
    )
  }

  const { cliente, servicos, orcamentos, documentos } = data

  return (
    <div className="space-y-4">
      <PageHeader
        title={cliente.nome}
        subtitle={[cliente.cidade, cliente.condominio].filter(Boolean).join(' · ') || 'Cliente'}
        action={
          <Link to={`/clientes/${cliente.id}/editar`} className="btn-ghost">
            Editar
          </Link>
        }
      />

      {erroExcluir && <Alert tone="error">{erroExcluir}</Alert>}

      <Card>
        <Linha rotulo="CPF" valor={cliente.cpf} />
        <Linha rotulo="CNPJ" valor={cliente.cnpj} />
        <Linha rotulo="Responsável" valor={cliente.responsavel} />
        <Linha rotulo="Telefone" valor={cliente.telefone} />
        <Linha rotulo="WhatsApp" valor={cliente.whatsapp} />
        <Linha rotulo="E-mail" valor={cliente.email} />
        <Linha rotulo="Endereço" valor={cliente.endereco} />
        <Linha rotulo="Cidade" valor={cliente.cidade} />
        <Linha rotulo="Condomínio" valor={cliente.condominio} />
        <Linha rotulo="Cadastrado em" valor={formatDate(cliente.created_at)} />
      </Card>

      {cliente.observacoes && (
        <Card>
          <h2 className="mb-1 text-sm font-semibold text-slate-700">Observações</h2>
          <p className="whitespace-pre-wrap text-sm text-slate-600">{cliente.observacoes}</p>
        </Card>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center">
          <p className="text-xs text-slate-400">Mão de obra</p>
          <p className="text-sm font-bold text-ink-900">{formatCurrency(data.totalServicos)}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-slate-400">Materiais</p>
          <p className="text-sm font-bold text-ink-900">{formatCurrency(data.totalMateriais)}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-slate-400">Faturado</p>
          <p className="text-sm font-bold text-green-700">{formatCurrency(data.totalFaturado)}</p>
        </div>
      </div>

      <Card>
        <h2 className="mb-2 text-sm font-semibold text-slate-700">
          Serviços ({servicos.length})
        </h2>
        {servicos.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhum serviço registrado para este cliente.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {servicos.map((s) => (
              <li key={s.id}>
                <Link to={`/servicos/${s.id}`} className="flex items-start justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <p className="line-clamp-1 text-sm font-medium text-ink-900">
                      {s.descricao || 'Serviço'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatDate(s.data_servico ?? s.created_at)} ·{' '}
                      {formatCurrency(s.valor_mao_de_obra)}
                    </p>
                  </div>
                  <Badge tone={SERVICO_STATUS_META[s.status].tone}>
                    {SERVICO_STATUS_META[s.status].label}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="mb-2 text-sm font-semibold text-slate-700">
          Orçamentos ({orcamentos.length})
        </h2>
        {orcamentos.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhum orçamento para este cliente.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {orcamentos.map((o) => (
              <li key={o.id}>
                <Link to={`/orcamentos/${o.id}`} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink-900">{o.numero}</p>
                    <p className="text-xs text-slate-400">{formatDate(o.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={ORCAMENTO_STATUS_META[o.status].tone}>
                      {ORCAMENTO_STATUS_META[o.status].label}
                    </Badge>
                    <span className="text-sm font-semibold text-ink-900">
                      {formatCurrency(o.valor_total)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="mb-2 text-sm font-semibold text-slate-700">
          Documentos ({documentos.length})
        </h2>
        {documentos.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhum documento gerado para este cliente.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {documentos.map((doc) => (
              <li key={doc.id} className="py-2 text-sm">
                <p className="font-medium text-ink-900">{doc.titulo}</p>
                <p className="text-xs text-slate-400">{formatDate(doc.created_at)}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Button
        variant="ghost"
        fullWidth
        onClick={handleExcluir}
        disabled={excluindo}
        className="text-red-600 hover:bg-red-50"
      >
        {excluindo ? 'Excluindo…' : 'Excluir cliente'}
      </Button>
    </div>
  )
}
