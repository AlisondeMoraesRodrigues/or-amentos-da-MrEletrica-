/**
 * Margem sobre materiais (Checkpoint 08).
 *
 *   valor cobrado = custo × (1 + margem% / 100)
 *   valor da margem = valor cobrado − custo
 *
 * O valor de custo (o que foi realmente pago) é sempre mantido separado.
 */

function arredondar(valor: number): number {
  return Math.round((Number.isFinite(valor) ? valor : 0) * 100) / 100
}

/** Valor cobrado a partir do custo e da margem percentual. */
export function aplicarMargem(custo: number, margemPercentual: number): number {
  return arredondar(custo * (1 + margemPercentual / 100))
}

/** Valor absoluto da margem (cobrado − custo). */
export function valorDaMargem(custo: number, margemPercentual: number): number {
  return arredondar(aplicarMargem(custo, margemPercentual) - custo)
}

/** Margem percentual implícita quando o valor cobrado é informado manualmente. */
export function margemImplicita(custo: number, cobrado: number): number {
  if (custo <= 0) return 0
  return arredondar(((cobrado - custo) / custo) * 100)
}
