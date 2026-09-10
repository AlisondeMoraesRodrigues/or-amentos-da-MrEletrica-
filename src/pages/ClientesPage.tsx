import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { Loading } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAsync } from '@/hooks/useAsync'
import { listClientes } from '@/services/clientesService'
import type { ClienteRow } from '@/types/database'

function combina(cliente: ClienteRow): string {
  return [
    cliente.nome,
    cliente.cidade,
    cliente.condominio,
    cliente.responsavel,
    cliente.whatsapp,
    cliente.telefone,
    cliente.email,
    cliente.cpf,
    cliente.cnpj,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

export default function ClientesPage() {
  const [busca, setBusca] = useState('')
  const { data, loading, error, reload } = useAsync(() => listClientes(), [])

  const clientes = useMemo(() => data ?? [], [data])
  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return clientes
    return clientes.filter((c) => combina(c).includes(q))
  }, [busca, clientes])

  return (
    <div className="space-y-4">
      <PageHeader
        title="Clientes"
        subtitle={clientes.length ? `${clientes.length} cadastrado(s)` : 'Cadastro e histórico'}
        action={
          <Link to="/clientes/novo" className="btn-energy">
            + Novo
          </Link>
        }
      />

      <input
        className="input"
        placeholder="Pesquisar por nome, cidade, responsável…"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        aria-label="Pesquisar clientes"
      />

      {loading && <Loading label="Carregando clientes…" />}

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
          title={busca ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
          description={
            busca
              ? 'Ajuste a busca ou cadastre um novo cliente.'
              : 'Cadastre o primeiro cliente para começar.'
          }
          action={
            <Link to="/clientes/novo" className="btn-primary">
              + Novo cliente
            </Link>
          }
        />
      )}

      {!loading && !error && filtrados.length > 0 && (
        <ul className="space-y-3">
          {filtrados.map((c) => (
            <li key={c.id}>
              <Link to={`/clientes/${c.id}`} className="block">
                <Card className="transition-colors hover:bg-slate-50">
                  <p className="font-semibold text-ink-900">{c.nome}</p>
                  {(c.cidade || c.condominio) && (
                    <p className="mt-0.5 text-sm text-slate-500">
                      {[c.cidade, c.condominio].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                    {c.whatsapp && <span>WhatsApp: {c.whatsapp}</span>}
                    {!c.whatsapp && c.telefone && <span>Tel.: {c.telefone}</span>}
                    {c.responsavel && <span>Resp.: {c.responsavel}</span>}
                    {(c.cpf || c.cnpj) && <span>{c.cpf ?? c.cnpj}</span>}
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Button variant="ghost" fullWidth onClick={reload} disabled={loading}>
        Atualizar lista
      </Button>
    </div>
  )
}
