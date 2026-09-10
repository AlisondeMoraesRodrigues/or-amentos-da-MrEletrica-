/**
 * Cálculo imediato de lucro e margem (Checkpoint 25).
 *
 *   Receita  = tudo que o cliente paga
 *              (mão de obra + materiais cobrados + deslocamento + outros)
 *   Custo    = tudo que você gasta
 *              (materiais a preço de custo + custo da equipe que você paga)
 *   Lucro    = Receita − Custo
 *   Margem % = Lucro ÷ Receita × 100   (0 quando a receita é 0)
 *
 * O deslocamento e os "outros custos" são cobrados do cliente (entram na
 * receita). Se algum deles for na verdade uma despesa sua, lance em
 * "custo da equipe / despesas" no serviço.
 */

export interface EntradaLucro {
  maoDeObraCobrada: number
  materiaisCobrado: number
  materiaisCusto: number
  deslocamento?: number
  outrosCustos?: number
  /** O que você paga à equipe (ajudante/terceiro) — não é cobrado do cliente. */
  custoMaoDeObra?: number
}

export interface ResultadoLucro {
  receita: number
  custo: number
  lucro: number
  margemPct: number
}

function r2(n: number): number {
  return Math.round((Number.isFinite(n) ? n : 0) * 100) / 100
}

export function calcularLucro(e: EntradaLucro): ResultadoLucro {
  const deslocamento = e.deslocamento ?? 0
  const outros = e.outrosCustos ?? 0
  const custoEquipe = e.custoMaoDeObra ?? 0

  const receita = r2(e.maoDeObraCobrada + e.materiaisCobrado + deslocamento + outros)
  const custo = r2(e.materiaisCusto + custoEquipe)
  const lucro = r2(receita - custo)
  const margemPct = receita > 0 ? r2((lucro / receita) * 100) : 0

  return { receita, custo, lucro, margemPct }
}
