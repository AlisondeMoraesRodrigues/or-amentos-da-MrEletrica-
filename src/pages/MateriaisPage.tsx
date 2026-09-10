import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { Loading } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAsync } from '@/hooks/useAsync'
import { listMateriais } from '@/services/materiaisService'
import { listServicos } from '@/services/servicosService'
import { listClientes } from '@/services/clientesService'
import { UNIDADE_LABEL } from '@/config/material'
import { formatCurrency } from '@/utils/format'

export default function MateriaisPage() {
  const { data, loading, error, reload } = useAsync(async () => {
    const [materiais, servicos, clientes] = await Promise.all([
      listMateriais(),
      listServicos(),
      listClientes(),
    ])
    const clientePorId = new Map(clientes.map((c) => [c.id, c.nome]))
    const servicoPorId = new Map(
      servicos.map((s) => [
        s.id,
        {
          descricao: s.descricao,
          cliente: s.cliente_id ? clientePorId.get(s.cliente_id) ?? null : null,
        },
      ]),
    )
    return { materiais, servicoPorId }
  }, [])

  const materiais = useMemo(() => data?.materiais ?? [], [data])
  const totais = useMemo(
    () =>
      materiais.reduce(
        (acc, m) => ({
          custo: acc.custo + m.valor_custo * m.quantidade,
          cobrado: acc.cobrado + m.valor_cobrado * m.quantidade,
        }),
        { custo: 0, cobrado: 0 },
      ),
    [materiais],
  )

  return (
    <div className="space-y-4">
      <PageHeader title="Materiais" subtitle="Materiais dos serviços" />

      <Card className="flex flex-col items-center gap-2 border-dashed py-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </div>
        <p className="font-semibold text-ink-900">Fotografar / enviar nota fiscal</p>
        <p className="max-w-xs text-sm text-slate-500">
          Abra um serviço e use "Notas fiscais / cupons" para enviar foto, imagem ou PDF,
          e "Ler itens" para extrair os materiais da nota.
        </p>
      </Card>

      <p className="text-sm text-slate-500">
        Os materiais são adicionados dentro de cada serviço. Abra um{' '}
        <Link to="/servicos" className="font-semibold text-brand-600 underline">
          serviço
        </Link>{' '}
        para incluir materiais.
      </p>

      {loading && <Loading label="Carregando materiais…" />}

      {!loading && error && (
        <Alert tone="error">
          {error}{' '}
          <button type="button" onClick={reload} className="font-semibold underline">
            Tentar novamente
          </button>
        </Alert>
      )}

      {!loading && !error && materiais.length === 0 && (
        <EmptyState
          title="Nenhum material registrado"
          description="Adicione materiais a partir da tela de um serviço."
        />
      )}

      {!loading && !error && materiais.length > 0 && (
        <>
          <ul className="space-y-3">
            {materiais.map((m) => {
              const ctx = m.servico_id ? data?.servicoPorId.get(m.servico_id) : null
              return (
                <li key={m.id}>
                  <Card>
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-semibold text-ink-900">{m.nome}</p>
                      {m.servico_id && (
                        <Link
                          to={`/servicos/${m.servico_id}`}
                          className="shrink-0 text-xs font-semibold text-brand-600 underline"
                        >
                          Ver serviço
                        </Link>
                      )}
                    </div>
                    {ctx && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-slate-400">
                        {ctx.cliente ? `${ctx.cliente} — ` : ''}
                        {ctx.descricao}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                      <span>
                        {m.quantidade} {UNIDADE_LABEL[m.unidade]}
                      </span>
                      <span>Custo: {formatCurrency(m.valor_custo)}</span>
                      <span>Cobrado: {formatCurrency(m.valor_cobrado)}</span>
                      <span className="font-medium text-ink-900">
                        Subtotal: {formatCurrency(m.valor_cobrado * m.quantidade)}
                      </span>
                    </div>
                  </Card>
                </li>
              )
            })}
          </ul>

          <Card className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Total de custo</span>
              <span className="font-medium">{formatCurrency(totais.custo)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total cobrado</span>
              <span className="font-medium">{formatCurrency(totais.cobrado)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-1">
              <span className="text-slate-500">Diferença</span>
              <span className="font-semibold text-green-700">
                {formatCurrency(totais.cobrado - totais.custo)}
              </span>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
