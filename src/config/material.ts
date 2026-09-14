import type { MaterialUnidade, PrecoReferencia } from '@/types/database'

export const UNIDADE_LABEL: Record<MaterialUnidade, string> = {
  un: 'Unidade',
  m: 'Metro',
  m2: 'Metro²',
  kg: 'Quilo',
  cx: 'Caixa',
  rl: 'Rolo',
  pc: 'Peça',
  l: 'Litro',
  h: 'Hora',
}

export const UNIDADE_ORDEM: MaterialUnidade[] = ['un', 'm', 'm2', 'kg', 'cx', 'rl', 'pc', 'l', 'h']

/** Margem padrão sobre materiais (fallback quando não há configuração). */
export const MARGEM_PADRAO = 20

/** Opções rápidas de margem. */
export const MARGENS_PRESET = [0, 10, 20, 30, 40] as const

/** Como sugerir o preço de venda a partir do histórico de compras (CP27). */
export const PRECO_REFERENCIA_META: Record<PrecoReferencia, string> = {
  ultimo: 'Último preço pago',
  medio: 'Preço médio',
  maior: 'Maior preço histórico',
  menor: 'Menor preço histórico',
  personalizado: 'Personalizado',
}

export const PRECO_REFERENCIA_ORDEM: PrecoReferencia[] = [
  'maior',
  'ultimo',
  'medio',
  'menor',
  'personalizado',
]
