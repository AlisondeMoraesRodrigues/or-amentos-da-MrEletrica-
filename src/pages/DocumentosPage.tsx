import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { Loading } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAsync } from '@/hooks/useAsync'
import { listDocumentos } from '@/services/documentosService'
import { formatDate } from '@/utils/format'
import type { DocumentoTipo } from '@/types/database'

const TIPO_LABEL: Record<DocumentoTipo, string> = {
  orcamento: 'Orçamento',
  ordem_servico: 'Ordem de serviço',
  relatorio_tecnico: 'Relatório técnico',
  recibo: 'Recibo',
}

export default function DocumentosPage() {
  const { data, loading, error, reload } = useAsync(() => listDocumentos(), [])
  const documentos = data ?? []

  return (
    <div className="space-y-4">
      <PageHeader
        title="Documentos"
        subtitle={documentos.length ? `${documentos.length} gerado(s)` : 'Histórico de PDFs gerados'}
        action={
          <Link to="/recibos/novo" className="btn-energy">
            + Recibo
          </Link>
        }
      />

      <Card className="text-sm text-slate-500">
        Os PDFs são gerados a partir do <strong>orçamento</strong> (orçamento e recibo) e do{' '}
        <strong>serviço</strong> (ordem de serviço e relatório técnico). Aqui fica o histórico.
      </Card>

      {loading && <Loading label="Carregando documentos…" />}

      {!loading && error && (
        <Alert tone="error">
          {error}{' '}
          <button type="button" onClick={reload} className="font-semibold underline">
            Tentar novamente
          </button>
        </Alert>
      )}

      {!loading && !error && documentos.length === 0 && (
        <EmptyState
          title="Nenhum documento gerado"
          description="Gere um orçamento, ordem de serviço, relatório ou recibo em PDF."
        />
      )}

      {!loading && !error && documentos.length > 0 && (
        <ul className="space-y-3">
          {documentos.map((d) => (
            <li key={d.id}>
              <Card className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink-900">{d.titulo}</p>
                  <p className="text-xs text-slate-400">
                    {TIPO_LABEL[d.tipo]} · {formatDate(d.created_at)}
                  </p>
                </div>
                {d.orcamento_id && (
                  <Link
                    to={`/orcamentos/${d.orcamento_id}`}
                    className="shrink-0 text-xs font-semibold text-brand-600 underline"
                  >
                    Ver orçamento
                  </Link>
                )}
                {!d.orcamento_id && d.servico_id && (
                  <Link
                    to={`/servicos/${d.servico_id}`}
                    className="shrink-0 text-xs font-semibold text-brand-600 underline"
                  >
                    Ver serviço
                  </Link>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
