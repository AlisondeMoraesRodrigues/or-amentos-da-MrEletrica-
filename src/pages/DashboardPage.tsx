import { Link, useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Loading } from '@/components/ui/Loading'
import { Badge } from '@/components/ui/Badge'
import { useAsync } from '@/hooks/useAsync'
import { getResumoDashboard } from '@/services/dashboardService'
import { ORCAMENTO_STATUS_META } from '@/config/orcamento'
import { SERVICO_STATUS_META } from '@/config/servico'
import { formatCurrency, formatDate } from '@/utils/format'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { data: resumo, loading, error, reload } = useAsync(() => getResumoDashboard(), [])

  return (
    <div className="space-y-5">
      <PageHeader title="Dashboard" subtitle="Visão geral" />

      {loading && <Loading label="Carregando…" />}
      {!loading && error && (
        <Alert tone="error">
          {error}{' '}
          <button type="button" onClick={reload} className="font-semibold underline">
            Tentar novamente
          </button>
        </Alert>
      )}

      {!loading && !error && resumo && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Orçamentos do mês" value={String(resumo.orcamentosMes)} />
            <StatCard label="Serviços concluídos" value={String(resumo.servicosRealizados)} />
            <StatCard label="Valor faturado" value={formatCurrency(resumo.valorFaturado)} />
            <StatCard label="Materiais registrados" value={String(resumo.materiaisUtilizados)} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Button variant="energy" fullWidth onClick={() => navigate('/orcamentos/novo')}>
              + Novo orçamento
            </Button>
            <Button fullWidth onClick={() => navigate('/servicos/novo')}>
              + Novo serviço
            </Button>
          </div>

          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700">Orçamentos recentes</h2>
              <Link to="/orcamentos" className="text-xs font-semibold text-brand-600 underline">
                Ver todos
              </Link>
            </div>
            {resumo.orcamentosRecentes.length === 0 ? (
              <p className="text-sm text-slate-400">Nenhum orçamento ainda.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {resumo.orcamentosRecentes.map((o) => (
                  <li key={o.id}>
                    <Link to={`/orcamentos/${o.id}`} className="flex items-center justify-between py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink-900">{o.clienteNome}</p>
                        <p className="text-xs text-slate-400">
                          {o.numero} · {formatDate(o.created_at)}
                        </p>
                      </div>
                      <div className="ml-3 flex shrink-0 items-center gap-2">
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
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700">Serviços recentes</h2>
              <Link to="/servicos" className="text-xs font-semibold text-brand-600 underline">
                Ver todos
              </Link>
            </div>
            {resumo.servicosRecentes.length === 0 ? (
              <p className="text-sm text-slate-400">Nenhum serviço ainda.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {resumo.servicosRecentes.map((s) => (
                  <li key={s.id}>
                    <Link to={`/servicos/${s.id}`} className="flex items-start justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink-900">{s.clienteNome}</p>
                        <p className="line-clamp-1 text-xs text-slate-400">{s.descricao}</p>
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

          <Link to="/financeiro" className="btn-ghost w-full">
            Ver financeiro
          </Link>
        </>
      )}
    </div>
  )
}
