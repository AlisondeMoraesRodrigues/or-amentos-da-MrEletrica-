import { listServicos } from './servicosService'
import { listOrcamentos } from './orcamentosService'
import { listMateriais } from './materiaisService'

export interface ResumoFinanceiro {
  gastoMateriais: number
  cobradoMateriais: number
  margemMateriais: number
  maoDeObra: number
  faturamento: number
  totalOrcado: number
  orcamentosAprovados: number
  orcamentosPendentes: number
  servicosConcluidos: number
  servicosTotal: number
}

function r2(n: number): number {
  return Math.round(n * 100) / 100
}

export async function getResumoFinanceiro(): Promise<ResumoFinanceiro> {
  const [servicos, orcamentos, materiais] = await Promise.all([
    listServicos(),
    listOrcamentos(),
    listMateriais(),
  ])

  const gastoMateriais = r2(materiais.reduce((s, m) => s + m.valor_custo * m.quantidade, 0))
  const cobradoMateriais = r2(materiais.reduce((s, m) => s + m.valor_cobrado * m.quantidade, 0))
  const maoDeObra = r2(servicos.reduce((s, v) => s + v.valor_mao_de_obra, 0))

  const aprovados = orcamentos.filter((o) => o.status === 'aprovado')
  const pendentes = orcamentos.filter((o) => o.status === 'rascunho' || o.status === 'enviado')

  return {
    gastoMateriais,
    cobradoMateriais,
    margemMateriais: r2(cobradoMateriais - gastoMateriais),
    maoDeObra,
    faturamento: r2(aprovados.reduce((s, o) => s + o.valor_total, 0)),
    totalOrcado: r2(orcamentos.reduce((s, o) => s + o.valor_total, 0)),
    orcamentosAprovados: aprovados.length,
    orcamentosPendentes: pendentes.length,
    servicosConcluidos: servicos.filter((s) => s.status === 'concluido').length,
    servicosTotal: servicos.length,
  }
}
