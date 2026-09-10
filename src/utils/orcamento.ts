/**
 * Cálculo do orçamento (Checkpoint 13).
 *
 *   VALOR TOTAL = materiais + margem de materiais + mão de obra
 *               + deslocamento + outros custos
 *
 * O valor de custo dos materiais e a margem ficam separados para aparecerem
 * discriminados no orçamento (e no PDF, no Checkpoint 14).
 */

export interface ComponentesOrcamento {
  valorMateriais: number
  valorMargemMateriais: number
  valorMaoDeObra: number
  valorDeslocamento: number
  outrosCustos: number
}

function arredondar(valor: number): number {
  return Math.round((Number.isFinite(valor) ? valor : 0) * 100) / 100
}

export function calcularTotalOrcamento(c: ComponentesOrcamento): number {
  return arredondar(
    c.valorMateriais +
      c.valorMargemMateriais +
      c.valorMaoDeObra +
      c.valorDeslocamento +
      c.outrosCustos,
  )
}

/** Total cobrado pelos materiais (custo + margem). */
export function totalMateriaisCobrado(c: Pick<ComponentesOrcamento, 'valorMateriais' | 'valorMargemMateriais'>): number {
  return arredondar(c.valorMateriais + c.valorMargemMateriais)
}

export function formatarNumeroOrcamento(ano: number, sequencia: number): string {
  return `ORC-${ano}-${String(sequencia).padStart(3, '0')}`
}
