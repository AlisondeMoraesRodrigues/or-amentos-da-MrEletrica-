import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { Loading } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { Fab } from '@/components/ui/Fab'
import { useAsync } from '@/hooks/useAsync'
import { listServicos } from '@/services/servicosService'
import { listClientes } from '@/services/clientesService'
import { SERVICO_STATUS_META, SERVICO_STATUS_ORDEM } from '@/config/servico'
import { formatCurrency, formatDate } from '@/utils/format'
import type { ServicoStatus } from '@/types/database'

export default function ServicosPage() {
  const [filtro, setFiltro] = useState<'todos' | ServicoStatus>('todos')
  const { data, loading, error, reload } = useAsync(
    async () => {
      const [servicos, clientes] = await Promise.all([listServicos(), listClientes()])
      const nomePorId = new Map(clientes.map((c) => [c.id, c.nome]))
      return { servicos, nomePorId }
    },
    [],
  )

  const servicos = useMemo(() => data?.servicos ?? [], [data])
  const filtrados = useMemo(
    () => (filtro === 'todos' ? servicos : servicos.filter((s) => s.status === filtro)),
    [servicos, filtro],
  )

  return (
    <div className="space-y-4 pb-20">
      <PageHeader
        title="Serviços"
        subtitle={servicos.length ? `${servicos.length} registrado(s)` : 'Horas, técnicos e mão de obra'}
        action={
          <Link to="/servicos/novo" className="btn-energy">
            + Novo
          </Link>
        }
      />

      <div className="flex flex-wrap gap-2">
        {(['todos', ...SERVICO_STATUS_ORDEM] as ('todos' | ServicoStatus)[]).map((op) => (
          <button
            key={op}
            type="button"
            onClick={() => setFiltro(op)}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              filtro === op ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'
            }`}
          >
            {op === 'todos' ? 'Todos' : SERVICO_STATUS_META[op].label}
          </button>
        ))}
      </div>

      {loading && <Loading label="Carregando serviços…" />}

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
          title={filtro === 'todos' ? 'Nenhum serviço registrado' : 'Nenhum serviço neste status'}
          description="Crie um serviço para registrar horas, técnicos e mão de obra."
          action={
            <Link to="/servicos/novo" className="btn-primary">
              + Novo serviço
            </Link>
          }
        />
      )}

      {!loading && !error && filtrados.length > 0 && (
        <ul className="space-y-3">
          {filtrados.map((s) => {
            const meta = SERVICO_STATUS_META[s.status]
            return (
              <li key={s.id}>
                <Link to={`/servicos/${s.id}`} className="block">
                  <Card className="transition-colors hover:bg-slate-50">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-semibold text-ink-900">
                        {s.cliente_id ? data?.nomePorId.get(s.cliente_id) ?? 'Cliente removido' : 'Sem cliente'}
                      </p>
                      <Badge tone={meta.tone}>{meta.label}</Badge>
                    </div>
                    {s.descricao && (
                      <p className="mt-1 line-clamp-2 text-sm text-slate-500">{s.descricao}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                      <span>{s.quantidade_tecnicos} técnico(s)</span>
                      <span>{s.horas_trabalhadas}h</span>
                      <span>Mão de obra: {formatCurrency(s.valor_mao_de_obra)}</span>
                      <span>{formatDate(s.data_servico ?? s.created_at)}</span>
                    </div>
                  </Card>
                </Link>
              </li>
            )
          })}
        </ul>
      )}

      <Fab to="/servicos/novo" label="Novo serviço" />
    </div>
  )
}
