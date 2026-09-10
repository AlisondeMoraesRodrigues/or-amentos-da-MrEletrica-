import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { Loading } from '@/components/ui/Loading'
import { StatCard } from '@/components/ui/StatCard'
import { useAsync } from '@/hooks/useAsync'
import { getResumoFinanceiro } from '@/services/financeiroService'
import { formatCurrency } from '@/utils/format'

export default function FinanceiroPage() {
  const { data, loading, error, reload } = useAsync(() => getResumoFinanceiro(), [])

  return (
    <div className="space-y-4">
      <PageHeader title="Financeiro" subtitle="Materiais, mão de obra e faturamento" />

      {loading && <Loading label="Calculando…" />}
      {!loading && error && (
        <Alert tone="error">
          {error}{' '}
          <button type="button" onClick={reload} className="font-semibold underline">
            Tentar novamente
          </button>
        </Alert>
      )}

      {!loading && !error && data && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Gasto em materiais" value={formatCurrency(data.gastoMateriais)} />
            <StatCard label="Materiais cobrados" value={formatCurrency(data.cobradoMateriais)} />
            <StatCard label="Margem sobre materiais" value={formatCurrency(data.margemMateriais)} />
            <StatCard label="Mão de obra" value={formatCurrency(data.maoDeObra)} />
          </div>

          <Card className="space-y-2">
            <h2 className="text-sm font-semibold text-slate-700">Faturamento</h2>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Orçamentos aprovados ({data.orcamentosAprovados})</span>
              <span className="font-bold text-green-700">{formatCurrency(data.faturamento)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Em aberto ({data.orcamentosPendentes} orçamentos)</span>
              <span className="font-medium text-ink-900">
                {formatCurrency(data.totalOrcado - data.faturamento)}
              </span>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-2 text-sm">
              <span className="text-slate-500">Total orçado</span>
              <span className="font-medium">{formatCurrency(data.totalOrcado)}</span>
            </div>
          </Card>

          <Card className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Serviços concluídos</span>
              <span className="font-medium">
                {data.servicosConcluidos} de {data.servicosTotal}
              </span>
            </div>
          </Card>

          <p className="text-center text-xs text-slate-400">
            Valores somados de todos os serviços, materiais e orçamentos registrados.
          </p>
        </>
      )}
    </div>
  )
}
