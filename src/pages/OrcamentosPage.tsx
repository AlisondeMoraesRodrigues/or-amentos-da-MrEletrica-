import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { Loading } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAsync } from '@/hooks/useAsync'
import { listOrcamentos } from '@/services/orcamentosService'
import { listClientes } from '@/services/clientesService'
import { ORCAMENTO_STATUS_META, ORCAMENTO_STATUS_ORDEM } from '@/config/orcamento'
import { formatCurrency, formatDate } from '@/utils/format'
import type { OrcamentoStatus } from '@/types/database'

export default function OrcamentosPage() {
  const [filtro, setFiltro] = useState<'todos' | OrcamentoStatus>('todos')
  const { data, loading, error, reload } = useAsync(async () => {
    const [orcamentos, clientes] = await Promise.all([listOrcamentos(), listClientes()])
    const nomePorId = new Map(clientes.map((c) => [c.id, c.nome]))
    return { orcamentos, nomePorId }
  }, [])

  const orcamentos = useMemo(() => data?.orcamentos ?? [], [data])
  const filtrados = useMemo(
    () => (filtro === 'todos' ? orcamentos : orcamentos.filter((o) => o.status === filtro)),
    [orcamentos, filtro],
  )

  return (
    <div className="space-y-4">
      <PageHeader
        title="Orçamentos"
        subtitle={orcamentos.length ? `${orcamentos.length} registrado(s)` : 'Criação e acompanhamento'}
        action={
          <Link to="/orcamentos/novo" className="btn-energy">
            + Novo
          </Link>
        }
      />

      <div className="flex flex-wrap gap-2">
        {(['todos', ...ORCAMENTO_STATUS_ORDEM] as ('todos' | OrcamentoStatus)[]).map((op) => (
          <button
            key={op}
            type="button"
            onClick={() => setFiltro(op)}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              filtro === op ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'
            }`}
          >
            {op === 'todos' ? 'Todos' : ORCAMENTO_STATUS_META[op].label}
          </button>
        ))}
      </div>

      {loading && <Loading label="Carregando orçamentos…" />}

      {!loading && error && (
        <Alert tone="error">
          {error}{' '}
          <button type="button" onClick={reload} className="font-semibold underline">
            Tentar novamente
          </button>
        </Alert>
      )}

      {!loading && !error && filtrados.length === 0 && (
        <EmptyState
          title={filtro === 'todos' ? 'Nenhum orçamento' : 'Nenhum orçamento neste status'}
          description="Crie um orçamento do zero ou a partir de um serviço."
          action={
            <Link to="/orcamentos/novo" className="btn-primary">
              + Novo orçamento
            </Link>
          }
        />
      )}

      {!loading && !error && filtrados.length > 0 && (
        <ul className="space-y-3">
          {filtrados.map((o) => {
            const meta = ORCAMENTO_STATUS_META[o.status]
            return (
              <li key={o.id}>
                <Link to={`/orcamentos/${o.id}`} className="block">
                  <Card className="transition-colors hover:bg-slate-50">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-ink-900">
                          {o.cliente_id ? data?.nomePorId.get(o.cliente_id) ?? 'Cliente removido' : 'Sem cliente'}
                        </p>
                        <p className="text-xs text-slate-400">
                          {o.numero} · {formatDate(o.created_at)}
                        </p>
                      </div>
                      <Badge tone={meta.tone}>{meta.label}</Badge>
                    </div>
                    <p className="mt-2 text-lg font-bold text-ink-900">
                      {formatCurrency(o.valor_total)}
                    </p>
                  </Card>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
