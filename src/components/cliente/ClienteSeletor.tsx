import { useEffect, useMemo, useState } from 'react'
import type { ClienteRow } from '@/types/database'

function combina(cliente: ClienteRow): string {
  return [cliente.nome, cliente.cpf, cliente.cnpj, cliente.telefone, cliente.whatsapp, cliente.condominio]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

/**
 * Campo de pesquisa/seleção de cliente (Checkpoint 27): pesquisa por nome,
 * CPF/CNPJ, telefone, WhatsApp ou condomínio; "+ Novo cliente" abre o
 * cadastro rápido sem perder o que já foi preenchido no serviço.
 */
export function ClienteSeletor({
  clientes,
  value,
  onChange,
  onNovoCliente,
}: {
  clientes: ClienteRow[]
  value: string
  onChange: (id: string) => void
  onNovoCliente: (nomeDigitado: string) => void
}) {
  const selecionado = useMemo(() => clientes.find((c) => c.id === value) ?? null, [clientes, value])
  const [busca, setBusca] = useState(selecionado?.nome ?? '')
  const [aberto, setAberto] = useState(false)

  useEffect(() => {
    setBusca(selecionado?.nome ?? '')
  }, [selecionado])

  const resultados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    const lista = q ? clientes.filter((c) => combina(c).includes(q)) : clientes
    return lista.slice(0, 30)
  }, [busca, clientes])

  return (
    <div className="relative">
      <label className="mb-1 block text-sm font-medium text-slate-700">Cliente</label>
      <input
        className="input"
        placeholder="🔍 Pesquisar por nome, CPF/CNPJ, telefone, condomínio…"
        value={busca}
        onFocus={() => setAberto(true)}
        onChange={(e) => {
          setBusca(e.target.value)
          setAberto(true)
          if (value) onChange('')
        }}
      />
      {aberto && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setAberto(false)} />
          <div className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-xl bg-white p-1 shadow-lg ring-1 ring-slate-200">
            <button
              type="button"
              onClick={() => {
                setAberto(false)
                onNovoCliente(busca)
              }}
              className="block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-brand-600 hover:bg-brand-50"
            >
              + Novo cliente{busca.trim() ? ` "${busca.trim()}"` : ''}
            </button>
            {resultados.length === 0 && (
              <p className="px-3 py-2 text-sm text-slate-400">Nenhum cliente encontrado.</p>
            )}
            {resultados.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  onChange(c.id)
                  setBusca(c.nome)
                  setAberto(false)
                }}
                className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50"
              >
                <span className="font-medium text-ink-900">{c.nome}</span>
                {(c.condominio || c.cidade) && (
                  <span className="ml-2 text-xs text-slate-400">
                    {[c.condominio, c.cidade].filter(Boolean).join(' · ')}
                  </span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
