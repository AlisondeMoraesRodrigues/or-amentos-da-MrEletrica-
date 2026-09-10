import { listOrcamentos } from './orcamentosService'
import { listServicos } from './servicosService'
import { listClientes } from './clientesService'
import { listMateriais } from './materiaisService'
import { getResumoFinanceiro } from './financeiroService'
import type { OrcamentoRow, ServicoRow } from '@/types/database'

export interface DashboardResumo {
  orcamentosMes: number
  servicosRealizados: number
  valorFaturado: number
  materiaisUtilizados: number
  orcamentosRecentes: (OrcamentoRow & { clienteNome: string })[]
  servicosRecentes: (ServicoRow & { clienteNome: string })[]
}

/**
 * Resumo do dashboard — dados reais (serviços, orçamentos, materiais, financeiro).
 * Checkpoint 20.
 */
export async function getResumoDashboard(): Promise<DashboardResumo> {
  const [orcamentos, servicos, clientes, materiais, financeiro] = await Promise.all([
    listOrcamentos(),
    listServicos(),
    listClientes(),
    listMateriais(),
    getResumoFinanceiro(),
  ])

  const nomePorId = new Map(clientes.map((c) => [c.id, c.nome]))
  const nome = (id: string | null) =>
    id ? (nomePorId.get(id) ?? 'Cliente removido') : 'Sem cliente'
  const mesAtual = new Date().toISOString().slice(0, 7)

  return {
    orcamentosMes: orcamentos.filter((o) => o.created_at.slice(0, 7) === mesAtual).length,
    servicosRealizados: financeiro.servicosConcluidos,
    valorFaturado: financeiro.faturamento,
    materiaisUtilizados: materiais.length,
    orcamentosRecentes: orcamentos
      .slice()
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 5)
      .map((o) => ({ ...o, clienteNome: nome(o.cliente_id) })),
    servicosRecentes: servicos
      .slice()
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 5)
      .map((s) => ({ ...s, clienteNome: nome(s.cliente_id) })),
  }
}
